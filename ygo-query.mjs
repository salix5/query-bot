import extra_setcodes from './data/extra_setcodes.json' with { type: 'json' };
import { readFile, writeFile } from 'node:fs/promises';
import initSqlJs from 'sql.js';
import { ltable_ocg, ltable_tcg, ltable_md } from './ygo-json-loader.mjs';
import { md_card_list } from './ygo-json-loader.mjs';
import { id_to_cid, cid_table } from './ygo-json-loader.mjs';
import { lang, collator_locale, bls_postfix, official_name, game_name } from './ygo-json-loader.mjs';
import { name_table, md_table, md_table_sc } from './ygo-json-loader.mjs';
import { inverse_mapping, zh_collator, zh_compare } from './ygo-utility.mjs';
import { db_url1, db_url2, fetch_db } from './ygo-fetch.mjs';
import { card_types, monster_types, link_markers, md_rarity, spell_colors, trap_colors } from "./ygo-constant.mjs";

// special ID
const ID_TYLER_THE_GREAT_WARRIOR = 68811206;
const ID_BLACK_LUSTER_SOLDIER = 5405695;
const ALT_POLYMERIZATION = 27847700;
const ALT_DARK_MAGICIAN = 36996508;
const CID_BLACK_LUSTER_SOLDIER = 19092;
const CARD_ARTWORK_VERSIONS_OFFSET = 20;
const MAX_CARD_ID = 99999999;

const select_all = `SELECT datas.id, ot, alias, setcode, type, atk, def, level, attribute, race, name, "desc" FROM datas, texts WHERE datas.id == texts.id`;
const select_id = `SELECT datas.id FROM datas, texts WHERE datas.id == texts.id`;
const select_name = `SELECT datas.id, name FROM datas, texts WHERE datas.id == texts.id`;

const base_filter = ` AND datas.id != $tyler AND NOT type & $token`;
const no_alt_filter = ` AND (datas.id == $luster OR abs(datas.id - alias) >= $artwork_offset)`;
const default_filter = `${base_filter}${no_alt_filter}`;
const effect_filter = ` AND (NOT type & $normal OR type & $pendulum)`;

const stmt_default = `${select_all}${default_filter}`;
const arg_default = {
	$tyler: ID_TYLER_THE_GREAT_WARRIOR,
	$luster: ID_BLACK_LUSTER_SOLDIER,
	$artwork_offset: CARD_ARTWORK_VERSIONS_OFFSET,
	$token: monster_types.TYPE_TOKEN,
};

const stmt_base = `${select_all}${base_filter}`;
const arg_base = {
	$tyler: ID_TYLER_THE_GREAT_WARRIOR,
	$token: monster_types.TYPE_TOKEN,
};

const stmt_no_alias = `${select_id}${base_filter} AND alias == $none`;
const arg_no_alias = {
	$tyler: ID_TYLER_THE_GREAT_WARRIOR,
	$token: monster_types.TYPE_TOKEN,
	$none: 0,
};
const regexp_mention = `(?<=「)[^「」]*「?[^「」]*」?[^「」]*(?=」)`;

export {
	ID_TYLER_THE_GREAT_WARRIOR, ID_BLACK_LUSTER_SOLDIER,
	ALT_DARK_MAGICIAN, ALT_POLYMERIZATION,
	CID_BLACK_LUSTER_SOLDIER,
	select_all, select_id, select_name,
	base_filter, no_alt_filter, default_filter, effect_filter,
	stmt_default, stmt_base, stmt_no_alias,
	arg_default, arg_base, arg_no_alias,
	regexp_mention,
};

const complete_name_table = Object.create(null);
for (const locale of Object.keys(official_name)) {
	const table1 = new Map(name_table[locale]);
	let valid = true;
	if (md_table[locale]) {
		for (const [cid, name] of md_table[locale]) {
			if (table1.has(cid)) {
				console.error(`duplicate cid: md_table[${locale}]`, cid);
				valid = false;
				break;
			}
			table1.set(cid, name);
		}
		if (!valid) {
			complete_name_table[locale] = new Map();
			continue;
		}
	}
	if (table1.has(CID_BLACK_LUSTER_SOLDIER))
		table1.set(CID_BLACK_LUSTER_SOLDIER, `${table1.get(CID_BLACK_LUSTER_SOLDIER)}${bls_postfix[locale]}`);
	complete_name_table[locale] = table1;
}

export {
	lang, official_name,
	cid_table, name_table, md_table,
	complete_name_table, id_to_cid,
	md_card_list,
};

/**
 * @type {Database[]}
 */
const db_list = [];
const SQL = await initSqlJs();

/**
 * @typedef {Object} Entry
 * @property {number} id
 * @property {number} ot
 * @property {number} alias
 * @property {number[]} setcode
 * @property {number} type
 * @property {number} atk
 * @property {number} def
 * @property {number} level
 * @property {number} race
 * @property {number} attribute
 * @property {number} scale
 * 
 * @property {string} name
 * @property {string} desc
 */

/**
 * @typedef {Object} CardText
 * @property {string} desc
 * @property {string} [db_desc]
 */

/**
 * @typedef {Object} Card
 * @property {number} [cid]
 * @property {number} id
 * @property {string} tw_name
 * @property {string} [ae_name]
 * @property {string} [en_name]
 * @property {string} [jp_name]
 * @property {string} [kr_name]
 * @property {string} [md_name_en]
 * @property {string} [md_name_jp]
 * 
 * @property {number} ot
 * @property {number} alias
 * @property {number[]} setcode
 * @property {number} type
 * @property {number} atk
 * @property {number} def
 * @property {number} level
 * @property {number} race
 * @property {number} attribute
 * @property {number} [scale]
 * @property {number} [md_rarity]
 * @property {CardText} text
 * 
 * @property {number} artid
 * @property {number} color - Card color for sorting
 */

const over_hundred = '(name like $101 OR name like $102 OR name like $103 OR name like $104 OR name like $105 OR name like $106 OR name like $107)';
const stmt_seventh = `${stmt_default} AND type & $xyz AND ${over_hundred}`;
const arg_seventh = {
	...arg_default,
	$xyz: monster_types.TYPE_XYZ,
};
for (let i = 0; i < 7; ++i) {
	arg_seventh[`$${101 + i}`] = `%No.${101 + i}%`;
}
const mmap_seventh = Object.create(null);
const card_table = new Map();

export { stmt_seventh, arg_seventh };

//workwround
await init_query();

function multimap_insert(mmap, key, value) {
	if (!mmap[key])
		mmap[key] = [];
	mmap[key].push(value);
}

function multimap_clear(mmap) {
	for (const key of Object.keys(mmap))
		delete mmap[key];
}

/**
 * Set `card.setcode` from int64.
 * @param {Card} card 
 * @param {bigint} setcode 
 */
function set_setcode(card, setcode) {
	while (setcode) {
		if (setcode & 0xffffn) {
			card.setcode.push(Number(setcode & 0xffffn));
		}
		setcode = (setcode >> 16n) & 0xffffffffffffn;
	}
}

/**
 * Query cards from `db` with statement `qstr` and binding object `arg` and put them in `ret`.
 * @param {Database} db 
 * @param {string} qstr 
 * @param {Object} arg 
 * @returns {Entry[]}
 */
function query_db(db, qstr, arg) {
	const ret = [];
	const stmt = db.prepare(qstr);
	stmt.bind(arg);
	while (stmt.step()) {
		const cdata = stmt.getAsObject(null, { useBigInt: true });
		const card = Object.create(null);
		for (const [column, value] of Object.entries(cdata)) {
			switch (column) {
				case 'setcode':
					card.setcode = [];
					if (value) {
						if (extra_setcodes[card.id]) {
							for (const x of extra_setcodes[card.id])
								card.setcode.push(x);
						}
						else {
							set_setcode(card, value);
						}
					}
					break;
				case 'level':
					card.level = Number(value) & 0xff;
					card.scale = (Number(value) >> 24) & 0xff;
					break;
				default:
					if (typeof value === 'bigint')
						card[column] = Number(value);
					else
						card[column] = value;
					break;
			}
		}
		ret.push(card);
	}
	stmt.free();
	return ret;
}

function generate_card(cdata) {
	let artid = 0;
	if (is_alternative(cdata)) {
		artid = cdata.id;
		cdata.id = cdata.alias;
		cdata.alias = 0;
	}
	const card = Object.create(null);
	if (id_to_cid.has(cdata.id))
		card.cid = id_to_cid.get(cdata.id);
	card.id = cdata.id;
	card.tw_name = cdata.name;
	if (card.cid) {
		for (const [locale, prop] of Object.entries(official_name)) {
			if (name_table[locale].has(card.cid))
				card[prop] = name_table[locale].get(card.cid);
			else if (md_table[locale] && md_table[locale].has(card.cid))
				card[game_name[locale]] = md_table[locale].get(card.cid);
		}
	}
	for (const [column, value] of Object.entries(cdata)) {
		switch (column) {
			case "id":
			case "name":
			case "desc":
				continue;
			case "scale":
				if (cdata.type & monster_types.TYPE_PENDULUM)
					card[column] = value;
				break;
			default:
				card[column] = value;
				break;
		}
	}
	if (card.cid && md_card_list[card.cid])
		card.md_rarity = md_card_list[card.cid];
	card.text = Object.create(null);
	card.text.desc = cdata.desc;
	card.artid = artid;
	// color
	if (card.type & card_types.TYPE_MONSTER) {
		if (!(card.type & monster_types.TYPE_EXTRA)) {
			if (card.type & monster_types.TYPE_TOKEN)
				card.color = 0;
			else if (card.type & monster_types.TYPE_NORMAL)
				card.color = 1;
			else if (card.type & monster_types.TYPE_RITUAL)
				card.color = 3;
			else if (card.type & monster_types.TYPE_EFFECT)
				card.color = 2;
			else
				card.color = -1;
		}
		else {
			if (card.type & monster_types.TYPE_FUSION)
				card.color = 4;
			else if (card.type & monster_types.TYPE_SYNCHRO)
				card.color = 5;
			else if (card.type & monster_types.TYPE_XYZ)
				card.color = 6;
			else if (card.type & monster_types.TYPE_LINK)
				card.color = 7;
			else
				card.color = -1;
		}
	}
	else if (card.type & card_types.TYPE_SPELL) {
		const extype = card.type & ~card_types.TYPE_SPELL;
		if (spell_colors[extype])
			card.color = spell_colors[extype];
		else
			card.color = -1;
	}
	else if (card.type & card_types.TYPE_TRAP) {
		const extype = card.type & ~card_types.TYPE_TRAP;
		if (trap_colors[extype])
			card.color = trap_colors[extype];
		else
			card.color = -1;
	}
	else {
		card.color = -1;
	}
	return card;
}

/**
 * The sqlite condition of monsters related to No.101 ~ No.107.
 * @returns 
 */
// eslint-disable-next-line no-unused-vars
function create_seventh_condition() {
	let condition1 = '0';
	for (let i = 1; i <= 13; ++i) {
		if (!mmap_seventh[i])
			continue;
		let attr_value = 0;
		let race_value = 0;
		for (const card of mmap_seventh[i]) {
			attr_value |= card.attribute;
			race_value |= card.race;
		}
		condition1 += ` OR level == ${i} AND (attribute & ${attr_value} OR race & ${race_value})`;
	}
	const ret = ` AND type & $monster AND NOT type & $extra AND (${condition1})`;
	return ret;
}


//query
/**
 * @param {string[]} [files] 
 */
export async function init_query(files) {
	if (!files) {
		const temp1 = `${import.meta.dirname}/temp/db1.cdb`;
		const temp2 = `${import.meta.dirname}/temp/db2.cdb`;
		await Promise.all([writeFile(temp1, await fetch_db(db_url1)), writeFile(temp2, await fetch_db(db_url2))]);
		files = [temp1, temp2];
	}
	for (const db of db_list) {
		db.close();
	}
	db_list.length = 0;
	multimap_clear(mmap_seventh);
	card_table.clear();
	for (const file of files) {
		db_list.push(new SQL.Database(await readFile(file)));
	}
	const seventh_cards = query(stmt_seventh, arg_seventh);
	seventh_cards.sort((c1, c2) => zh_collator.compare(c1.tw_name, c2.tw_name));
	for (const card of seventh_cards) {
		multimap_insert(mmap_seventh, card.level, card);
	}
	for (const card of query()) {
		card_table.set(card.id, card);
	}
}

/**
 * Check if the card is an alternative artwork card.
 * @param {Entry} record
 * @returns 
 */
export function is_alternative(record) {
	if (record.id === ID_BLACK_LUSTER_SOLDIER)
		return false;
	return Math.abs(record.id - record.alias) < CARD_ARTWORK_VERSIONS_OFFSET;
}

/**
 * Check if the card has an official card name.
 * @param {Card} card
 * @returns
 */
export function is_released(card) {
	return !!(card.jp_name || card.en_name);
}

/**
 * Check if `card.setode` contains `value`.
 * @param {Card} card 
 * @param {number} value 
 * @returns
 */
export function is_setcode(card, value) {
	const settype = value & 0x0fff;
	const setsubtype = value & 0xf000;
	for (const x of card.setcode) {
		if ((x & 0x0fff) === settype && (x & 0xf000 & setsubtype) === setsubtype)
			return true;
	}
	return false;
}

/**
 * The sqlite condition of checking setcode.
 * @param {number} setcode
 * @param {Object} arg
 * @returns {string}
 */
export function setcode_condition(setcode, arg) {
	const setcode_str1 = `(setcode & $mask12) == $setname AND (setcode & $settype) == $settype`;
	const setcode_str2 = `(setcode >> $sec1 & $mask12) == $setname AND (setcode >> $sec1 & $settype) == $settype`;
	const setcode_str3 = `(setcode >> $sec2 & $mask12) == $setname AND (setcode >> $sec2 & $settype) == $settype`;
	const setcode_str4 = `(setcode >> $sec3 & $mask12) == $setname AND (setcode >> $sec3 & $settype) == $settype`;
	const ret = `(${setcode_str1} OR ${setcode_str2} OR ${setcode_str3} OR ${setcode_str4})`;
	arg.$setname = setcode & 0x0fff;
	arg.$settype = setcode & 0xf000;
	arg.$mask12 = 0x0fff;
	arg.$sec1 = 16;
	arg.$sec2 = 32;
	arg.$sec3 = 48;
	return ret;
}


/**
 * Query card from all databases with statement `qstr` and binding object `arg`.
 * @param {string} qstr 
 * @param {Object} arg 
 * @returns {Card[]}
 */
export function query(qstr = stmt_default, arg = arg_default) {
	const ret = [];
	for (const db of db_list) {
		for (const cdata of query_db(db, qstr, arg)) {
			ret.push(generate_card(cdata));
		}
	}
	return ret;
}

/**
 * Query card from all databases with `alias`.
 * @param {number} alias 
 * @returns {Card[]}
 */
export function query_alias(alias) {
	const qstr = `${stmt_default} AND alias == $alias;`;
	const arg = {
		...arg_default,
		$alias: alias,
	};
	return query(qstr, arg);
}

/**
 * Get a card with cid or temp id from all databases.
 * @param {number|string} cid 
 * @returns {?Card}
 */
export function get_card(cid) {
	if (typeof cid === 'string')
		cid = Number.parseInt(cid, 10);
	if (!Number.isSafeInteger(cid))
		return null;
	let id = 0;
	if (cid > MAX_CARD_ID)
		id = cid;
	else if (cid_table.has(cid))
		id = cid_table.get(cid);
	else
		return null;
	if (card_table.has(id))
		return card_table.get(id);
	return null;
}

/**
 * Get the card name of `id` in the region `locale`.
 * @param {number} cid 
 * @param {string} locale 
 * @returns {string}
 */
export function get_name(cid, locale) {
	if (locale === 'md') {
		if (md_table_sc.has(cid))
			return md_table_sc.get(cid);
		else
			return '';
	}
	if (!complete_name_table[locale])
		return '';
	if (complete_name_table[locale].has(cid)) {
		if (cid === CID_BLACK_LUSTER_SOLDIER) {
			if (complete_name_table[locale].has(4370))
				return complete_name_table[locale].get(4370);
			else
				return complete_name_table[locale].get(cid);
		}
		else
			return complete_name_table[locale].get(cid);
	}
	else
		return '';
}

/**
 * Get the request_locale of `card` in region `locale`.
 * @param {Card} card 
 * @param {string} locale 
 * @returns {string}
 */
export function get_request_locale(card, locale) {
	if (card[official_name[locale]]) {
		return locale;
	}
	else if (card.ot === 2) {
		return 'en';
	}
	else {
		return 'ja';
	}
}

/**
 * Get No.101 ~ No.107 Xyz Monsters with the same race or attribute.
 * @param {Card} card 
 * @returns {Card[]}
 */
export function get_seventh_xyz(card) {
	const result = [];
	if (!(card.type & card_types.TYPE_MONSTER))
		return result;
	if (card.type & monster_types.TYPE_EXTRA)
		return result;
	if (!mmap_seventh[card.level])
		return result;
	for (const seventh of mmap_seventh[card.level]) {
		if (!seventh.cid)
			continue;
		if ((seventh.race & card.race) || (seventh.attribute & card.attribute)) {
			result.push(seventh);
		}
	}
	return result;
}

/**
 * Print the ATK or DEF of a card.
 * @param {number} x 
 * @returns {string}
 */
export function print_ad(x) {
	if (x === -2)
		return '?';
	else
		return x.toString();
}

/**
 * Print the stat of `card` in language `locale`, using newline char `newline`.
 * @param {Card} card 
 * @param {string} newline 
 * @param {string} locale 
 * @returns {string}
 */
export function print_data(card, newline, locale) {
	const strings = lang[locale];
	let data = '';

	if (card.type & card_types.TYPE_MONSTER) {
		const mtype = strings.type_name[card_types.TYPE_MONSTER];
		let subtype = '';
		let lvstr = '\u2605';
		if (card.type & monster_types.TYPE_RITUAL)
			subtype = `/${strings.type_name[monster_types.TYPE_RITUAL]}`;
		else if (card.type & monster_types.TYPE_FUSION)
			subtype = `/${strings.type_name[monster_types.TYPE_FUSION]}`;
		else if (card.type & monster_types.TYPE_SYNCHRO)
			subtype = `/${strings.type_name[monster_types.TYPE_SYNCHRO]}`;
		else if (card.type & monster_types.TYPE_XYZ) {
			subtype = `/${strings.type_name[monster_types.TYPE_XYZ]}`;
			lvstr = `\u2606`;
		}
		else if (card.type & monster_types.TYPE_LINK) {
			subtype = `/${strings.type_name[monster_types.TYPE_LINK]}`;
			lvstr = `LINK-`;
		}
		if (card.type & monster_types.TYPE_PENDULUM) {
			subtype += `/${strings.type_name[monster_types.TYPE_PENDULUM]}`;
		}

		// extype
		if (card.type & monster_types.TYPE_NORMAL)
			subtype += `/${strings.type_name[monster_types.TYPE_NORMAL]}`;
		if (card.type & monster_types.TYPE_SPIRIT)
			subtype += `/${strings.type_name[monster_types.TYPE_SPIRIT]}`;
		if (card.type & monster_types.TYPE_UNION)
			subtype += `/${strings.type_name[monster_types.TYPE_UNION]}`;
		if (card.type & monster_types.TYPE_DUAL)
			subtype += `/${strings.type_name[monster_types.TYPE_DUAL]}`;
		if (card.type & monster_types.TYPE_TUNER)
			subtype += `/${strings.type_name[monster_types.TYPE_TUNER]}`;
		if (card.type & monster_types.TYPE_FLIP)
			subtype += `/${strings.type_name[monster_types.TYPE_FLIP]}`;
		if (card.type & monster_types.TYPE_TOON)
			subtype += `/${strings.type_name[monster_types.TYPE_TOON]}`;
		if (card.type & monster_types.TYPE_SPSUMMON)
			subtype += `/${strings.type_name[monster_types.TYPE_SPSUMMON]}`;
		if (card.type & monster_types.TYPE_EFFECT)
			subtype += `/${strings.type_name[monster_types.TYPE_EFFECT]}`;
		data = `[${mtype}${subtype}]${newline}`;

		data += `${lvstr}${card.level === 0 ? '?' : card.level}`;
		if (card.attribute)
			data += `/${strings.attribute_name[card.attribute]}`;
		else
			data += `/${strings.attribute_name['unknown']}`;
		if (card.race)
			data += `/${strings.race_name[card.race]}`;
		else
			data += `/${strings.race_name['unknown']}`;
		data += `/${strings.value_name['atk']}${print_ad(card.atk)}`;
		if (!(card.type & monster_types.TYPE_LINK)) {
			data += `/${strings.value_name['def']}${print_ad(card.def)}`;
		}
		data += newline;

		if (card.type & monster_types.TYPE_PENDULUM) {
			data += `【${strings.value_name['scale']}：${card.scale}】${newline}`;
		}
		if (card.type & monster_types.TYPE_LINK) {
			let marker_text = '';
			for (let marker = link_markers.LINK_MARKER_TOP_LEFT; marker <= link_markers.LINK_MARKER_TOP_RIGHT; marker <<= 1) {
				if (card.def & marker)
					marker_text += strings.marker_char[marker];
				else
					marker_text += strings.marker_char['default'];
			}
			marker_text += newline;

			if (card.def & link_markers.LINK_MARKER_LEFT)
				marker_text += strings.marker_char[link_markers.LINK_MARKER_LEFT];
			else
				marker_text += strings.marker_char['default'];

			marker_text += strings.marker_char['default'];

			if (card.def & link_markers.LINK_MARKER_RIGHT)
				marker_text += strings.marker_char[link_markers.LINK_MARKER_RIGHT];
			else
				marker_text += strings.marker_char['default'];

			marker_text += newline;

			for (let marker = link_markers.LINK_MARKER_BOTTOM_LEFT; marker <= link_markers.LINK_MARKER_BOTTOM_RIGHT; marker <<= 1) {
				if (card.def & marker)
					marker_text += strings.marker_char[marker];
				else
					marker_text += strings.marker_char['default'];
			}
			marker_text += newline;
			data += marker_text;
		}
	}
	else if (card.type & card_types.TYPE_SPELL) {
		const extype = card.type & ~card_types.TYPE_SPELL;
		const mtype = `${strings.type_name[card_types.TYPE_SPELL]}`;
		let subtype = '';
		if (spell_colors[extype])
			subtype = `/${strings.type_name[extype]}`;
		else
			subtype = `/???`;
		data = `[${mtype}${subtype}]${newline}`;
	}
	else if (card.type & card_types.TYPE_TRAP) {
		const extype = card.type & ~card_types.TYPE_TRAP;
		const mtype = `${strings.type_name[card_types.TYPE_TRAP]}`;
		let subtype = '';
		if (trap_colors[extype])
			subtype = `/${strings.type_name[extype]}`;
		else
			subtype = `/???`;
		data = `[${mtype}${subtype}]${newline}`;
	}
	return data;
}

/**
 * Print `card` in language `locale`.
 * @param {Card} card 
 * @param {string} locale 
 * @returns {string}
 */
export function print_card(card, locale) {
	const strings = lang[locale];
	let lfstr = '';
	let lfstr_ocg = '';
	let lfstr_tcg = '';
	let lfstr_md = '';

	let card_name = 'null';
	let other_name = '';
	let desc = '';

	switch (locale) {
		case 'zh-tw':
			card_name = card.tw_name;
			if (card.jp_name)
				other_name += `${card.jp_name}\n`;
			else if (card.md_name_jp)
				other_name += `${card.md_name_jp}    (MD)\n`;
			if (card.en_name)
				other_name += `${card.en_name}\n`;
			else if (card.md_name_en)
				other_name += `${card.md_name_en}    (MD)\n`;
			desc = `${card.text.desc}\n--`;
			break;
		case 'ae':
			card_name = card.ae_name;

			if (card.jp_name)
				other_name = `${card.jp_name}\n`;
			else if (card.md_name_jp)
				other_name = `${card.md_name_jp}    (MD)\n`;
			desc = card.text.db_desc ?? '';
			break;
		case 'ja':
			if (card.jp_name)
				card_name = card.jp_name;
			else if (card.md_name_jp)
				card_name = `${card.md_name_jp}    (MD)`;

			if (card.en_name)
				other_name = `${card.en_name}\n`;
			else if (card.md_name_en)
				other_name = `${card.md_name_en}    (MD)\n`;
			desc = card.text.db_desc ?? '';
			break;
		case 'ko':
			if (card.kr_name)
				card_name = card.kr_name;

			if (card.en_name)
				other_name = `${card.en_name}\n`;
			else if (card.md_name_en)
				other_name = `${card.md_name_en}    (MD)\n`;
			desc = card.text.db_desc ?? '';
			break;
		case 'en':
			if (card.en_name)
				card_name = card.en_name;
			else if (card.md_name_en)
				card_name = `${card.md_name_en}    (MD)`;

			if (card.jp_name)
				other_name = `${card.jp_name}\n`;
			else if (card.md_name_jp)
				other_name = `${card.md_name_jp}    (MD)\n`;
			desc = card.text.db_desc ?? '';
			break;
		default:
			break;
	}

	if (card.md_rarity)
		other_name += `MD：${md_rarity[card.md_rarity]}\n`;
	let show_lflist = false;
	if (Number.isSafeInteger(ltable_ocg[card.id])) {
		lfstr_ocg = `OCG：${strings.limit_name[ltable_ocg[card.id]]}`;
		show_lflist = true;
	}
	else {
		lfstr_ocg = `OCG：-`;
	}
	if (Number.isSafeInteger(ltable_tcg[card.id])) {
		lfstr_tcg = `TCG：${strings.limit_name[ltable_tcg[card.id]]}`;
		show_lflist = true;
	}
	else {
		lfstr_tcg = `TCG：-`;
	}
	if (Number.isSafeInteger(ltable_md[card.id])) {
		lfstr_md = `MD：${strings.limit_name[ltable_md[card.id]]}`;
		show_lflist = true;
	}
	else {
		lfstr_md = `MD：-`;
	}
	if (show_lflist)
		lfstr = `(${lfstr_ocg} / ${lfstr_tcg} / ${lfstr_md})\n`;

	const card_text = `**${card_name}**\n${other_name}${lfstr}${print_data(card, '\n', locale)}${desc}\n`;
	return card_text;
}


//database file
/**
 * @param {number} id 
 * @returns 
 */
export function get_source_cid(id) {
	for (let i = id; i > id - CARD_ARTWORK_VERSIONS_OFFSET; --i) {
		if (id_to_cid.has(i))
			return id_to_cid.get(i);
	}
	return 0;
}


//table
/**
 * Create the [name, id] table of region `request_locale`
 * @param {string} request_locale 
 * @returns 
 */
export function create_choice(request_locale) {
	if (!collator_locale[request_locale])
		return (new Map());
	const inverse = inverse_mapping(complete_name_table[request_locale]);
	const collator = new Intl.Collator(collator_locale[request_locale]);
	const inverse_entries = [...inverse].sort((a, b) => collator.compare(a[0], b[0]));
	const result = new Map(inverse_entries);
	return result;
}

/**
 * Create the [name, id] table for pre-release cards.
 * @returns 
 */
export function create_choice_prerelease() {
	const inverse_table = new Map();
	const stmt_pre = `${stmt_default} AND datas.id > $ub`;
	const arg_pre = {
		...arg_default,
		$ub: MAX_CARD_ID,
	};
	const re_kanji = /※.*/;
	const pre_list = query(stmt_pre, arg_pre);
	for (const card of pre_list) {
		if (card.cid) {
			continue;
		}
		const res = card.text.desc.match(re_kanji);
		const kanji = res ? res[0] : '';
		if (inverse_table.has(card.tw_name) || kanji && inverse_table.has(kanji)) {
			console.error('choice_prerelease', card.id);
			return (new Map());
		}
		inverse_table.set(card.tw_name, card.id);
		if (kanji)
			inverse_table.set(kanji, card.id);
	}
	const inverse_entries = [...inverse_table].sort(zh_compare);
	const result = new Map(inverse_entries);
	return result;
}

export function create_name_table() {
	const cards = query(stmt_default, arg_default);
	const table1 = new Map();
	for (const card of cards) {
		if (card.cid)
			table1.set(card.cid, card.tw_name);
	}
	table1.set(CID_BLACK_LUSTER_SOLDIER, `${table1.get(CID_BLACK_LUSTER_SOLDIER)}${bls_postfix['zh-tw']}`);
	if (table1.size !== cid_table.size)
		console.error('invalid name_table_tw:', cid_table.size, table1.size);
	return table1;
}

/**
 * Parse param into sqlite statement condition.
 * @param {URLSearchParams} params 
 * @returns {[string, Object]}
 */
export function param_to_condition(params) {
	let qstr = "";
	const arg = { ...arg_default };
	// id, primary key
	if (params.has("id")) {
		const id = Number.parseInt(params.get("id"));
		qstr += " AND datas.id == $id";
		arg.$id = id;
		return [qstr, arg];
	}
	if (params.has("cid")) {
		const cid = Number.parseInt(params.get("cid"));
		qstr += " AND datas.id == $id";
		arg.$id = cid_table.get(cid) ?? 0;
		return [qstr, arg];
	}

	// type
	arg.$cardtype = 0;
	if (params.has("cardtype")) {
		qstr += ' AND type & $cardtype';
		arg.$cardtype = Number.parseInt(params.get("cardtype"));
	}
	if (params.has("subtype")) {
		if (params.has("subtype_operator", "1"))
			qstr += ' AND type & $subtype == $subtype';
		else
			qstr += ' AND type & $subtype';
		arg.$subtype = Number.parseInt(params.get("subtype"));
	}
	if (params.has("exclude")) {
		qstr += ' AND NOT type & $exclude';
		arg.$exclude = Number.parseInt(params.get("exclude"));
	}
	if (arg.$cardtype === 0 || arg.$cardtype === card_types.TYPE_MONSTER) {
		const matid = Number.parseInt(params.get("material"));
		if (matid && card_table.has(matid)) {
			const material = card_table.get(matid).tw_name;
			qstr += ` AND ("desc" LIKE $mat1 ESCAPE '$' OR "desc" LIKE $mat2 ESCAPE '$' OR "desc" LIKE $mat3 ESCAPE '$')`;
			arg.$mat1 = `「${material}」%+%`;
			arg.$mat2 = `%+「${material}」%`;
			arg.$mat3 = `%「${material}」×%`;
			arg.$cardtype |= card_types.TYPE_MONSTER;
		}

		// atk
		if (params.has("atk_from")) {
			const atk_from = Number.parseInt(params.get("atk_from"));
			arg.$cardtype |= card_types.TYPE_MONSTER;
			if (atk_from === -1) {
				qstr += " AND atk == $unknown";
				arg.$unknown = -2;
			}
			else {
				qstr += " AND atk >= $atk_from";
				arg.$atk_from = atk_from;
			}
		}
		if (params.has("atk_to")) {
			const atk_to = Number.parseInt(params.get("atk_to"));
			arg.$cardtype |= card_types.TYPE_MONSTER;
			qstr += " AND atk >= $zero AND atk <= $atk_to";
			arg.$zero = 0;
			arg.$atk_to = atk_to;
		}

		// def, exclude link monsters
		if (params.has("def_from") || params.has("def_to") || params.has("sum")) {
			qstr += " AND NOT type & $link";
			arg.$link = monster_types.TYPE_LINK;
			arg.$cardtype |= card_types.TYPE_MONSTER;
		}
		if (params.has("def_from")) {
			const def_from = Number.parseInt(params.get("def_from"));
			if (def_from === -1) {
				qstr += " AND def == $unknown";
				arg.$unknown = -2;
			}
			else if (def_from === -2) {
				qstr += " AND def == atk AND def >= $zero";
				arg.$zero = 0;
			}
			else {
				qstr += " AND def >= $def_from";
				arg.$def_from = def_from;
			}
		}
		if (params.has("def_to")) {
			const def_to = Number.parseInt(params.get("def_to"));
			qstr += " AND def >= $zero AND def <= $def_to";
			arg.$zero = 0;
			arg.$def_to = def_to;
		}
		if (params.has("sum")) {
			const sum = Number.parseInt(params.get("sum"));
			qstr += " AND atk >= $zero AND def >= $zero AND atk + def == $sum";
			arg.$zero = 0;
			arg.$sum = sum;
		}

		// lv, rank, link
		if (params.has("level") || params.has("level_from") || params.has("level_to")) {
			arg.$cardtype |= card_types.TYPE_MONSTER;
		}
		if (params.has("level")) {
			let level_condtion = "0";
			let index = 0;
			for (const value of params.getAll("level")) {
				level_condtion += ` OR (level & $mask) == $level${index}`;
				arg[`$level${index}`] = Number.parseInt(value);
				index++;
			}
			qstr += ` AND (${level_condtion})`;
			arg.$mask = 0xff;
		}
		if (params.has("level_from")) {
			qstr += " AND (level & $mask) >= $level_from";
			arg.$mask = 0xff;
			arg.$level_from = Number.parseInt(params.get("level_from"));
		}
		if (params.has("level_to")) {
			qstr += " AND (level & $mask) <= $level_to";
			arg.$mask = 0xff;
			arg.$level_to = Number.parseInt(params.get("level_to"));
		}

		// scale, pendulum monster only
		if (params.has("scale") || params.has("scale_from") || params.has("scale_to")) {
			qstr += " AND type & $pendulum";
			arg.$pendulum = monster_types.TYPE_PENDULUM;
			arg.$cardtype |= card_types.TYPE_MONSTER;
		}
		if (params.has("scale")) {
			let scale_condtion = "0";
			let index = 0;
			for (const value of params.getAll("scale")) {
				scale_condtion += ` OR (level >> $offset & $mask) == $scale${index}`;
				arg[`$scale${index}`] = Number.parseInt(value);
				index++;
			}
			qstr += ` AND (${scale_condtion})`;
			arg.$offset = 24;
			arg.$mask = 0xff;
		}
		if (params.has("scale_from")) {
			qstr += " AND (level >> $offset & $mask) >= $scale_from";
			arg.$offset = 24;
			arg.$mask = 0xff;
			arg.$scale_from = Number.parseInt(params.get("scale_from"));
		}
		if (params.has("scale_to")) {
			qstr += " AND (level >> $offset & $mask) <= $scale_to";
			arg.$offset = 24;
			arg.$mask = 0xff;
			arg.$scale_to = Number.parseInt(params.get("scale_to"));
		}

		// attribute, race
		if (params.has("attribute")) {
			qstr += " AND attribute & $attribute";
			arg.$attribute = Number.parseInt(params.get("attribute"))
			arg.$cardtype |= card_types.TYPE_MONSTER;
		}
		if (params.has("race")) {
			qstr += " AND race & $race";
			arg.$race = Number.parseInt(params.get("race"))
			arg.$cardtype |= card_types.TYPE_MONSTER;
		}
		// marker
		if (params.has("marker")) {
			qstr += " AND type & $link";
			arg.$link = monster_types.TYPE_LINK;
			if (params.has("marker_operator", "1"))
				qstr += " AND def & $marker == $marker";
			else
				qstr += " AND def & $marker";
			arg.$marker = Number.parseInt(params.get("marker"))
			arg.$cardtype |= card_types.TYPE_MONSTER;
		}
		if (arg.$cardtype === card_types.TYPE_MONSTER) {
			qstr += " AND type & $cardtype";
		}
	}
	return [qstr, arg];
}

export {
	inverse_mapping,
	print_db_link, print_yp_link, print_qa_link, print_history_link,
	escape_regexp, map_stringify, table_stringify,
	zh_compare,
} from './ygo-utility.mjs';

export {
	card_types, monster_types, spell_types, trap_types,
	link_markers, races, attributes,
} from './ygo-constant.mjs';
