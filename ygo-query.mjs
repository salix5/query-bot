import initSqlJs from 'sql.js';
import { ltable_ocg } from './json-loader.mjs';
import { ltable_tcg } from './json-loader.mjs';
import { ltable_md } from './json-loader.mjs';

import { cid_table } from './json-loader.mjs';
import { name_table_en } from './json-loader.mjs';
import { name_table_jp } from './json-loader.mjs';
import { name_table_kr } from './json-loader.mjs';
import { md_name } from './json-loader.mjs';
import { md_name_en } from './json-loader.mjs';
import { md_name_jp } from './json-loader.mjs';

import { lang_en } from './json-loader.mjs';
import { lang_ja } from './json-loader.mjs';
import { lang_ko } from './json-loader.mjs';
import { lang_zhtw } from './json-loader.mjs';

const domain = 'https://salix5.github.io/cdb';
const fetch_db = fetch(`${domain}/cards.cdb`).then(response => response.arrayBuffer()).then(buf => new Uint8Array(buf));
const fetch_db2 = fetch(`${domain}/expansions/pre-release.cdb`).then(response => response.arrayBuffer()).then(buf => new Uint8Array(buf));

// type
const TYPE_MONSTER = 0x1;
const TYPE_SPELL = 0x2;
const TYPE_TRAP = 0x4;

// color type
const TYPE_NORMAL = 0x10;
const TYPE_EFFECT = 0x20;
const TYPE_FUSION = 0x40;
const TYPE_RITUAL = 0x80;
const TYPE_SYNCHRO = 0x2000;
const TYPE_XYZ = 0x800000;
const TYPE_PENDULUM = 0x1000000;
const TYPE_LINK = 0x4000000;
const TYPE_EXTRA = TYPE_FUSION | TYPE_SYNCHRO | TYPE_XYZ | TYPE_LINK;

// extype
const TYPE_SPIRIT = 0x200;
const TYPE_UNION = 0x400;
const TYPE_DUAL = 0x800;
const TYPE_TUNER = 0x1000;
const TYPE_TOKEN = 0x4000;
const TYPE_FLIP = 0x200000;
const TYPE_TOON = 0x400000;
const TYPE_SPSUMMON = 0x2000000;

// spell type
const TYPE_QUICKPLAY = 0x10000;
const TYPE_CONTINUOUS = 0x20000;
const TYPE_EQUIP = 0x40000;
//const TYPE_RITUAL
const TYPE_FIELD = 0x80000;

// trap type
//const TYPE_CONTINUOUS
const TYPE_COUNTER = 0x100000;

// race
const RACE_WARRIOR = 0x1;
const RACE_SPELLCASTER = 0x2;
const RACE_FAIRY = 0x4;
const RACE_FIEND = 0x8;
const RACE_ZOMBIE = 0x10;
const RACE_MACHINE = 0x20;
const RACE_AQUA = 0x40;
const RACE_PYRO = 0x80;
const RACE_ROCK = 0x100;
const RACE_WINDBEAST = 0x200;
const RACE_PLANT = 0x400;
const RACE_INSECT = 0x800;
const RACE_THUNDER = 0x1000;
const RACE_DRAGON = 0x2000;
const RACE_BEAST = 0x4000;
const RACE_BEASTWARRIOR = 0x8000;
const RACE_DINOSAUR = 0x10000;
const RACE_FISH = 0x20000;
const RACE_SEASERPENT = 0x40000;
const RACE_REPTILE = 0x80000;
const RACE_PSYCHO = 0x100000;
const RACE_DIVINE = 0x200000;
const RACE_CREATORGOD = 0x400000;
const RACE_WYRM = 0x800000;
const RACE_CYBERSE = 0x1000000;
const RACE_ILLUSION = 0x2000000;

// attribute
const ATTRIBUTE_EARTH = 0x01;
const ATTRIBUTE_WATER = 0x02;
const ATTRIBUTE_FIRE = 0x04;
const ATTRIBUTE_WIND = 0x08;
const ATTRIBUTE_LIGHT = 0x10;
const ATTRIBUTE_DARK = 0x20;
const ATTRIBUTE_DIVINE = 0x40;

// Link Marker
const LINK_MARKER_BOTTOM_LEFT = 0x001;	// ↙
const LINK_MARKER_BOTTOM = 0x002;		// ↓
const LINK_MARKER_BOTTOM_RIGHT = 0x004;	// ↘

const LINK_MARKER_LEFT = 0x008;			// ←
const LINK_MARKER_RIGHT = 0x020;		// →

const LINK_MARKER_TOP_LEFT = 0x040;		// ↖
const LINK_MARKER_TOP = 0x080;			// ↑
const LINK_MARKER_TOP_RIGHT = 0x100;	// ↗

const type = {
	TYPE_MONSTER,
	TYPE_SPELL,
	TYPE_TRAP,
};

const monster_type = {
	TYPE_NORMAL,
	TYPE_EFFECT,
	TYPE_FUSION,
	TYPE_RITUAL,
	TYPE_SYNCHRO,
	TYPE_XYZ,
	TYPE_PENDULUM,
	TYPE_LINK,
	TYPE_EXTRA,

	TYPE_SPIRIT,
	TYPE_UNION,
	TYPE_DUAL,
	TYPE_TUNER,
	TYPE_TOKEN,
	TYPE_FLIP,
	TYPE_TOON,
	TYPE_SPSUMMON,
};

const spell_type = {
	TYPE_QUICKPLAY,
	TYPE_CONTINUOUS,
	TYPE_EQUIP,
	TYPE_RITUAL,
	TYPE_FIELD,
};

const trap_type = {
	TYPE_CONTINUOUS,
	TYPE_COUNTER,
};

const race = {
	RACE_WARRIOR,
	RACE_SPELLCASTER,
	RACE_FAIRY,
	RACE_FIEND,
	RACE_ZOMBIE,
	RACE_MACHINE,
	RACE_AQUA,
	RACE_PYRO,
	RACE_ROCK,
	RACE_WINDBEAST,
	RACE_PLANT,
	RACE_INSECT,
	RACE_THUNDER,
	RACE_DRAGON,
	RACE_BEAST,
	RACE_BEASTWARRIOR,
	RACE_DINOSAUR,
	RACE_FISH,
	RACE_SEASERPENT,
	RACE_REPTILE,
	RACE_PSYCHO,
	RACE_DIVINE,
	RACE_CREATORGOD,
	RACE_WYRM,
	RACE_CYBERSE,
	RACE_ILLUSION,
};

const attribute = {
	ATTRIBUTE_EARTH,
	ATTRIBUTE_WATER,
	ATTRIBUTE_FIRE,
	ATTRIBUTE_WIND,
	ATTRIBUTE_LIGHT,
	ATTRIBUTE_DARK,
	ATTRIBUTE_DIVINE,
};

const link_marker = {
	LINK_MARKER_BOTTOM_LEFT,
	LINK_MARKER_BOTTOM,
	LINK_MARKER_BOTTOM_RIGHT,

	LINK_MARKER_LEFT,
	LINK_MARKER_RIGHT,

	LINK_MARKER_TOP_LEFT,
	LINK_MARKER_TOP,
	LINK_MARKER_TOP_RIGHT,
};

export { type, monster_type, spell_type, trap_type, race, attribute, link_marker };

// special ID
const ID_TYLER_THE_GREAT_WARRIOR = 68811206;
const ID_BLACK_LUSTER_SOLDIER = 5405695;
const CID_BLACK_LUSTER_SOLDIER = 19092;
const CARD_ARTWORK_VERSIONS_OFFSET = 20;

const select_all = `SELECT datas.id, ot, alias, setcode, type, atk, def, level, attribute, race, name, "desc" FROM datas, texts WHERE datas.id == texts.id`;
const select_id = `SELECT datas.id FROM datas, texts WHERE datas.id == texts.id`;
const select_name = `SELECT datas.id, name FROM datas, texts WHERE datas.id == texts.id`;

const base_filter = ` AND datas.id != $tyler AND NOT type & $token`;
const physical_filter = `${base_filter} AND (datas.id == $luster OR abs(datas.id - alias) >= $artwork_offset)`;
const effect_filter = ` AND (NOT type & $normal OR type & $pendulum)`;

const stmt_default = `${select_all}${physical_filter}`;
const stmt_no_alias = `${select_id}${base_filter} AND alias == $zero`;
const arg_default = Object.create(null);
arg_default.$tyler = ID_TYLER_THE_GREAT_WARRIOR;
arg_default.$token = TYPE_TOKEN;
arg_default.$luster = ID_BLACK_LUSTER_SOLDIER;
arg_default.$artwork_offset = CARD_ARTWORK_VERSIONS_OFFSET;
arg_default.$zero = 0;
arg_default.$ub = 99999999;

export {
	ID_TYLER_THE_GREAT_WARRIOR, ID_BLACK_LUSTER_SOLDIER, CID_BLACK_LUSTER_SOLDIER,
	select_all, select_id, base_filter, physical_filter, effect_filter,
	stmt_default, stmt_no_alias,
	arg_default,
};


const lang = Object.create(null);
lang['en'] = lang_en;
lang['ja'] = lang_ja;
lang['ko'] = lang_ko;
lang['zh-tw'] = lang_zhtw;

const official_name = Object.create(null);
official_name['en'] = 'en_name';
official_name['ja'] = 'jp_name';
official_name['ko'] = 'kr_name';

const game_name = Object.create(null);
game_name['en'] = 'md_name_en';
game_name['ja'] = 'md_name_jp';

const name_table = Object.create(null);
name_table['en'] = name_table_en;
name_table['ja'] = name_table_jp;
name_table['ko'] = name_table_kr;
name_table['md'] = md_name;

const md_table = Object.create(null);
md_table['en'] = md_name_en;
md_table['ja'] = md_name_jp;

const cid_inverse = inverse_mapping(cid_table);
const complete_name_table = Object.create(null);
const option_table = Object.create(null);	// [id, name] mapping

for (const locale of Object.keys(official_name)) {
	const table1 = new Map(name_table[locale]);
	if (md_table[locale]) {
		for (const [cid, name] of md_table[locale]) {
			if (table1.has(cid)) {
				console.error(`duplicate cid: md_table[${locale}]`, cid);
				continue;
			}
			table1.set(cid, name);
		}
	}
	complete_name_table[locale] = table1;
	option_table[locale] = create_options(locale);
}

export {
	lang, official_name, cid_table, name_table, md_table,
	complete_name_table, cid_inverse, option_table,
};

const [SQL, buf1, buf2] = await Promise.all([initSqlJs(), fetch_db, fetch_db2]);
const db_list = [];
db_list.push(new SQL.Database(buf1));
db_list.push(new SQL.Database(buf2));

/**
 * @typedef {Object} Card
 * @property {number} id
 * @property {number} ot
 * @property {number} alias
 * @property {number[]} setcode
 * @property {number} real_id - The id of real card
 * 
 * @property {number} type
 * @property {number} atk
 * @property {number} def
 * @property {number} level
 * @property {number} scale
 * @property {number} race
 * @property {number} attribute
 * @property {number} color - Card color for sorting
 * 
 * @property {string} tw_name
 * @property {string} desc
 * 
 * @property {number} [cid]
 * @property {string} [en_name]
 * @property {string} [jp_name]
 * @property {string} [kr_name]
 * @property {string} [md_name]
 * @property {string} [md_name_en]
 * @property {string} [md_name_jp]
 */

const extra_setcode = {
	8512558: [0x8f, 0x54, 0x59, 0x82, 0x13a],
};

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
 * @param {initSqlJs.Database} db 
 * @param {string} qstr 
 * @param {Object} arg 
 * @param {Object[]} ret  
 */
function query_db(db, qstr, arg, ret) {
	if (!db)
		return;

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
						if (extra_setcode[card.id]) {
							for (const x of extra_setcode[card.id])
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
		// extra column
		if ('id' in card && 'alias' in card) {
			card.real_id = is_alternative(card) ? card.alias : card.id;
		}
		if ('real_id' in card && cid_table.has(card.real_id)) {
			card.cid = cid_table.get(card.real_id);
		}
		ret.push(card);
	}
	stmt.free();
}

function finalize(card) {
	if (card.type & TYPE_MONSTER) {
		if (!(card.type & TYPE_EXTRA)) {
			if (card.type & TYPE_TOKEN)
				card.color = 0;
			else if (card.type & TYPE_NORMAL)
				card.color = 1;
			else if (card.type & TYPE_RITUAL)
				card.color = 3;
			else if (card.type & TYPE_EFFECT)
				card.color = 2;
			else
				card.color = -1;
		}
		else {
			if (card.type & TYPE_FUSION)
				card.color = 4;
			else if (card.type & TYPE_SYNCHRO)
				card.color = 5;
			else if (card.type & TYPE_XYZ)
				card.color = 6;
			else if (card.type & TYPE_LINK)
				card.color = 7;
			else
				card.color = -1;
		}
	}
	else if (card.type & TYPE_SPELL) {
		if (card.type === TYPE_SPELL)
			card.color = 10;
		else if (card.type & TYPE_QUICKPLAY)
			card.color = 11;
		else if (card.type & TYPE_CONTINUOUS)
			card.color = 12;
		else if (card.type & TYPE_EQUIP)
			card.color = 13;
		else if (card.type & TYPE_RITUAL)
			card.color = 14;
		else if (card.type & TYPE_FIELD)
			card.color = 15;
		else
			card.color = -1;
	}
	else if (card.type & TYPE_TRAP) {
		if (card.type === TYPE_TRAP)
			card.color = 20;
		else if (card.type & TYPE_CONTINUOUS)
			card.color = 21;
		else if (card.type & TYPE_COUNTER)
			card.color = 22;
		else
			card.color = -1;
	}
	else {
		card.color = -1;
	}
	card.tw_name = card.name;
	delete card.name;
	if (card.cid) {
		for (const [locale, prop] of Object.entries(official_name)) {
			if (name_table[locale].has(card.cid))
				card[prop] = name_table[locale].get(card.cid);
			else if (md_table[locale] && md_table[locale].has(card.cid))
				card[game_name[locale]] = md_table[locale].get(card.cid);
		}
		if (name_table['md'].has(card.cid))
			card.md_name = name_table['md'].get(card.cid);
	}
}

/**
 * Create the [id, name] mapping.
 * @param {string} request_locale 
 * @returns 
 */
function create_options(request_locale) {
	const options = new Map();
	if (!complete_name_table[request_locale])
		return options;
	let postfix = '';
	switch (request_locale) {
		case 'en':
			postfix = ' (Normal)';
			break;
		case 'ja':
			postfix = '（通常モンスター）';
			break;
		case 'ko':
			postfix = ' (일반)';
			break;
		default:
			break;
	}
	for (const [cid, name] of complete_name_table[request_locale]) {
		if (!cid_inverse.has(cid)) {
			console.error(`unknown cid:`, cid);
			continue;
		}
		options.set(cid_inverse.get(cid), name);
	}
	if (options.has(ID_BLACK_LUSTER_SOLDIER))
		options.set(ID_BLACK_LUSTER_SOLDIER, `${options.get(ID_BLACK_LUSTER_SOLDIER)}${postfix}`);
	return options;
}

// export
/**
 * Create the inverse mapping of `table`.
 * @param {Map} table 
 * @returns 
 */
export function inverse_mapping(table) {
	const inverse = new Map();
	for (const [key, value] of table) {
		if (inverse.has(value)) {
			console.error('non-invertible', `${key}: ${value}`);
			return (new Map());
		}
		inverse.set(value, key);
	}
	return inverse;
}

/**
 * @param {Map} table 
 * @param {Function} compare 
 */
export function table_stringify(table, compare) {
	return JSON.stringify(Array.from(table).sort(compare), null, 1);
}

/**
 * Get cards from databases file `buffer` with statement `qstr` and binding object `arg`.
 * @param {Uint8Array} buffer
 * @param {string} qstr 
 * @param {Object} arg 
 * @returns {Object[]}
 */
export function load_db(buffer, qstr, arg) {
	const db = new SQL.Database(buffer);
	const ret = [];
	query_db(db, qstr, arg, ret);
	db.close();
	return ret;
}

/**
 * Create the [name, id] table of region `request_locale`
 * @param {string} request_locale 
 * @returns 
 */
export function create_choice(request_locale) {
	let locale = '';
	switch (request_locale) {
		case 'en':
			locale = 'en-US';
			break;
		case 'ja':
			locale = 'ja-JP';
			break;
		case 'ko':
			locale = 'ko-KR';
			break;
		default:
			return (new Map());
	}
	const inverse = inverse_mapping(option_table[request_locale]);
	const collator = new Intl.Collator(locale);
	const inverse_entries = Array.from(inverse);
	inverse_entries.sort((a, b) => collator.compare(a[0], b[0]));
	const result = new Map(inverse_entries);
	return result;
}

/**
 * Create the [name, id] table for pre-release cards.
 * @returns 
 */
export function create_choice_prerelease() {
	const inverse_table = new Map();
	const cmd_pre = `${select_all} AND datas.id > $ub${physical_filter}`;
	const arg = Object.assign(Object.create(null), arg_default);
	const re_kanji = /※.*/;
	const pre_list = query(cmd_pre, arg);
	for (const card of pre_list) {
		if (cid_table.has(card.id)) {
			continue;
		}
		const res = card.desc.match(re_kanji);
		const kanji = res ? res[0] : '';
		if (inverse_table.has(card.tw_name) || kanji && inverse_table.has(kanji)) {
			console.error('choice_prerelease', card.id);
			return (new Map());
		}
		inverse_table.set(card.tw_name, card.id);
		if (kanji)
			inverse_table.set(kanji, card.id);
	}
	const collator = Intl.Collator('zh-Hant');
	const inverse_entries = Array.from(inverse_table);
	inverse_entries.sort((a, b) => collator.compare(a[0], b[0]));
	const result = new Map(inverse_entries);
	return result;
}

export function create_name_table() {
	const cards = query(stmt_default, arg_default);
	const table1 = new Map();
	const postfix = '（通常怪獸）';
	for (const card of cards) {
		if (card.cid)
			table1.set(card.cid, card.tw_name);
	}
	table1.set(CID_BLACK_LUSTER_SOLDIER, `${table1.get(CID_BLACK_LUSTER_SOLDIER)}${postfix}`);
	return table1;
}

/**
 * Check if the card name is unique.
 * @param {Uint8Array} buffer 
 * @returns 
 */
export function check_uniqueness(buffer) {
	const condition = ` AND (NOT type & $token OR alias == $zero) AND (type & $token OR datas.id == $luster OR abs(datas.id - alias) >= $artwork_offset)`;
	const stmt1 = `${select_name}${condition}`
	const cards = load_db(buffer, stmt1, arg_default);
	console.log('total:', cards.length);
	const table1 = Object.create(null);
	const postfix = 'N';
	for (const card of cards) {
		table1[card.id] = card.name;
	}
	if (table1[ID_BLACK_LUSTER_SOLDIER])
		table1[ID_BLACK_LUSTER_SOLDIER] = `${table1[ID_BLACK_LUSTER_SOLDIER]}${postfix}`;
	const inv1 = inverse_mapping(table1);
	return Object.keys(inv1).length === cards.length;
}

/**
 * Check if the card is an alternative artwork card.
 * @param {Card} card
 * @returns 
 */
export function is_alternative(card) {
	if (card.id === ID_BLACK_LUSTER_SOLDIER)
		return false;
	else
		return Math.abs(card.id - card.alias) < CARD_ARTWORK_VERSIONS_OFFSET;
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
export function query(qstr, arg) {
	const ret = [];
	for (const db of db_list) {
		query_db(db, qstr, arg, ret);
	}
	for (const card of ret) {
		finalize(card);
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
	const arg = Object.assign(Object.create(null), arg_default);
	arg.$alias = alias;
	return query(qstr, arg);
}

/**
 * Get a card with `id` from all databases.
 * @param {number|string} id 
 * @returns {Card|null}
 */
export function get_card(id) {
	if (typeof id === 'string')
		id = Number.parseInt(id);
	if (!Number.isSafeInteger(id))
		return null;
	const qstr = `${select_all} AND datas.id == $id;`;
	const arg = Object.create(null);
	arg.$id = id;
	const ret = [];
	for (const db of db_list) {
		query_db(db, qstr, arg, ret);
		if (ret.length) {
			finalize(ret[0]);
			return ret[0];
		}
	}
	return null;
}

/**
 * Get the card name of `id` in the region `locale`.
 * @param {number} id 
 * @param {string} locale 
 * @returns {string}
 */
export function get_name(id, locale) {
	if (!cid_table.has(id))
		return '';
	let table = null;
	if (locale === 'md')
		table = name_table['md'];
	else if (complete_name_table[locale])
		table = complete_name_table[locale];
	else
		return '';

	const cid = cid_table.get(id);
	if (table.has(cid))
		return table.get(cid);
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
	let mtype = '';
	let subtype = '';
	let lvstr = '\u2605';
	let data = '';
	let strings = lang[locale];

	if (card.type & TYPE_MONSTER) {
		mtype = strings.type_name[TYPE_MONSTER];
		if (card.type & TYPE_RITUAL)
			subtype = `/${strings.type_name[TYPE_RITUAL]}`;
		else if (card.type & TYPE_FUSION)
			subtype = `/${strings.type_name[TYPE_FUSION]}`;
		else if (card.type & TYPE_SYNCHRO)
			subtype = `/${strings.type_name[TYPE_SYNCHRO]}`;
		else if (card.type & TYPE_XYZ) {
			subtype = `/${strings.type_name[TYPE_XYZ]}`;
			lvstr = `\u2606`;
		}
		else if (card.type & TYPE_LINK) {
			subtype = `/${strings.type_name[TYPE_LINK]}`;
			lvstr = `LINK-`;
		}
		if (card.type & TYPE_PENDULUM) {
			subtype += `/${strings.type_name[TYPE_PENDULUM]}`;
		}

		// extype
		if (card.type & TYPE_NORMAL)
			subtype += `/${strings.type_name[TYPE_NORMAL]}`;
		if (card.type & TYPE_SPIRIT)
			subtype += `/${strings.type_name[TYPE_SPIRIT]}`;
		if (card.type & TYPE_UNION)
			subtype += `/${strings.type_name[TYPE_UNION]}`;
		if (card.type & TYPE_DUAL)
			subtype += `/${strings.type_name[TYPE_DUAL]}`;
		if (card.type & TYPE_TUNER)
			subtype += `/${strings.type_name[TYPE_TUNER]}`;
		if (card.type & TYPE_FLIP)
			subtype += `/${strings.type_name[TYPE_FLIP]}`;
		if (card.type & TYPE_TOON)
			subtype += `/${strings.type_name[TYPE_TOON]}`;
		if (card.type & TYPE_SPSUMMON)
			subtype += `/${strings.type_name[TYPE_SPSUMMON]}`;
		if (card.type & TYPE_EFFECT)
			subtype += `/${strings.type_name[TYPE_EFFECT]}`;
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
		if (!(card.type & TYPE_LINK)) {
			data += `/${strings.value_name['def']}${print_ad(card.def)}`;
		}
		data += newline;

		if (card.type & TYPE_PENDULUM) {
			data += `【${strings.value_name['scale']}：${card.scale}】${newline}`;
		}
		if (card.type & TYPE_LINK) {
			let marker_text = '';
			for (let marker = LINK_MARKER_TOP_LEFT; marker <= LINK_MARKER_TOP_RIGHT; marker <<= 1) {
				if (card.def & marker)
					marker_text += strings.marker_char[marker];
				else
					marker_text += strings.marker_char['default'];
			}
			marker_text += newline;

			if (card.def & LINK_MARKER_LEFT)
				marker_text += strings.marker_char[LINK_MARKER_LEFT];
			else
				marker_text += strings.marker_char['default'];

			marker_text += strings.marker_char['default'];

			if (card.def & LINK_MARKER_RIGHT)
				marker_text += strings.marker_char[LINK_MARKER_RIGHT];
			else
				marker_text += strings.marker_char['default'];

			marker_text += newline;

			for (let marker = LINK_MARKER_BOTTOM_LEFT; marker <= LINK_MARKER_BOTTOM_RIGHT; marker <<= 1) {
				if (card.def & marker)
					marker_text += strings.marker_char[marker];
				else
					marker_text += strings.marker_char['default'];
			}
			marker_text += newline;
			data += marker_text;
		}
	}
	else if (card.type & TYPE_SPELL) {
		mtype = `${strings.type_name[TYPE_SPELL]}`;
		if (card.type & TYPE_QUICKPLAY)
			subtype = `/${strings.type_name[TYPE_QUICKPLAY]}`;
		else if (card.type & TYPE_CONTINUOUS)
			subtype = `/${strings.type_name[TYPE_CONTINUOUS]}`;
		else if (card.type & TYPE_EQUIP)
			subtype = `/${strings.type_name[TYPE_EQUIP]}`;
		else if (card.type & TYPE_RITUAL)
			subtype = `/${strings.type_name[TYPE_RITUAL]}`;
		else if (card.type & TYPE_FIELD)
			subtype = `/${strings.type_name[TYPE_FIELD]}`;
		else
			subtype = `/${strings.type_name[TYPE_NORMAL]}`;
		data = `[${mtype}${subtype}]${newline}`;
	}
	else if (card.type & TYPE_TRAP) {
		mtype = `${strings.type_name[TYPE_TRAP]}`;
		if (card.type & TYPE_CONTINUOUS)
			subtype = `/${strings.type_name[TYPE_CONTINUOUS]}`;
		else if (card.type & TYPE_COUNTER)
			subtype = `/${strings.type_name[TYPE_COUNTER]}`;
		else
			subtype = `/${strings.type_name[TYPE_NORMAL]}`;
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
	let lfstr = '';
	let lfstr_ocg = '';
	let lfstr_tcg = '';
	let lfstr_md = '';

	let strings = lang[locale];
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

			if (card.md_name)
				other_name += `MD：${card.md_name}\n`;
			desc = `${card.desc}\n--`;
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
			if (card.md_name)
				other_name += `MD：:white_check_mark:\n`;
			if (card.db_desc)
				desc = card.db_desc;
			break;
		case 'ko':
			if (card.kr_name)
				card_name = card.kr_name;

			if (card.en_name)
				other_name = `${card.en_name}\n`;
			else if (card.md_name_en)
				other_name = `${card.md_name_en}    (MD)\n`;
			if (card.md_name)
				other_name += `MD：:white_check_mark:\n`;
			if (card.db_desc)
				desc = card.db_desc;
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
			if (card.md_name)
				other_name += `MD：:white_check_mark:\n`;
			if (card.db_desc)
				desc = card.db_desc;
			break;
		default:
			break;
	}

	if (ltable_ocg[card.real_id] !== undefined)
		lfstr_ocg = `OCG：${strings.limit_name[ltable_ocg[card.real_id]]}`;
	else
		lfstr_ocg = `OCG：-`;
	if (ltable_tcg[card.real_id] !== undefined)
		lfstr_tcg = `TCG：${strings.limit_name[ltable_tcg[card.real_id]]}`;
	else
		lfstr_tcg = `TCG：-`;
	if (ltable_md[card.real_id] !== undefined)
		lfstr_md = `MD：${strings.limit_name[ltable_md[card.real_id]]}`;
	else
		lfstr_md = `MD：-`;
	if (ltable_ocg[card.real_id] !== undefined || ltable_tcg[card.real_id] !== undefined || ltable_md[card.real_id] !== undefined)
		lfstr = `(${lfstr_ocg} / ${lfstr_tcg} / ${lfstr_md})\n`;

	const card_text = `**${card_name}**\n${other_name}${lfstr}${print_data(card, '\n', locale)}${desc}\n`;
	return card_text;
}

export function print_db_link(cid, request_locale) {
	return `https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=${cid}&request_locale=${request_locale}`;
}

export function print_yp_link(id) {
	return `https://yugipedia.com/wiki/${id.toString().padStart(8, '0')}`;
}

export function print_qa_link(cid) {
	return `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=${cid}&request_locale=ja`;
}

export function print_history_link(cid) {
	return `https://github.com/salix5/ygodb/commits/master/${cid}.txt`;
}

/**
 * @param {string} string 
 * @returns 
 */
export function escape_regexp(string) {
	return string.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
}
