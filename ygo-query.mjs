import { rename, rm, writeFile } from 'node:fs/promises';
import { ltable_ocg, ltable_tcg, ltable_md, pack_list, pre_release, genesys_point, complete_name_table, setname_table } from './ygo-json-loader.mjs';
import { lang, collator_locale, bls_postfix, official_name, game_name } from './ygo-json-loader.mjs';
import { id_to_cid, cid_table, name_table, md_table, md_card_list } from './ygo-json-loader.mjs';
import { escape_regexp, escape_wildcard, inverse_mapping, zh_collator, zh_compare } from './ygo-utility.mjs';
import { db_url1, db_url2, fetch_db } from './ygo-fetch.mjs';
import { card_types, monster_types, link_markers, md_rarity, spell_colors, trap_colors, CID_BLACK_LUSTER_SOLDIER, spell_types, trap_types, MAX_CARD_ID } from "./ygo-constant.mjs";
import { arg_base, arg_default, arg_seventh, effect_filter, merge_db, stmt_base, stmt_count, stmt_default, stmt_seventh } from './ygo-sqlite.mjs';
import { is_alternative, like_pattern, name_condition, list_condition, query_db, setcode_condition, sqlite3_open, } from './ygo-sqlite.mjs';

export const regexp_mention = `(?<=「)[^「」]*「?[^「」]*」?[^「」]*(?=」)`;
const MAX_STRING_LENGTH = 10;
const db_list = [];

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
 * @property {bigint} race
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
 * @property {string} [jp_ruby]
 * @property {string} [kr_name]
 * @property {string} [md_name_en]
 * @property {string} [md_name_jp]
 * 
 * @property {number} ot
 * @property {number} alias
 * @property {number[]} setcode
 * @property {number} type
 * @property {number} atk
 * @property {number} [def]
 * @property {number} [marker]
 * @property {number} level
 * @property {bigint} race
 * @property {number} attribute
 * @property {number} [scale]
 * @property {number} [md_rarity]
 * @property {CardText} text
 * 
 * @property {number} artid
 * @property {number} color - Card color for sorting
 * @property {number} [pack_index]
 */

/**
 * @type {Map<number, Card>}
 */
const card_table = new Map();

const mmap_seventh = Object.create(null);

/**
 * @type {Set<number>}
 */
const ambiguous_name_list = new Set();

//workaround
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
 * @param {Entry} cdata 
 * @returns {Card}
 */
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
			if (locale === 'ja' && name_table['ruby'].has(card.cid))
				card.jp_ruby = name_table['ruby'].get(card.cid);
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
			case "def":
				if (cdata.type & monster_types.TYPE_LINK)
					card.marker = value;
				else
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
		if (!(card.type & monster_types.TYPES_EXTRA)) {
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
 * @returns {string}
 */
// eslint-disable-next-line no-unused-vars
function seventh_condition() {
	let condition1 = '0';
	for (let i = 1; i <= 13; i += 1) {
		if (!mmap_seventh[i])
			continue;
		let attr_value = 0;
		let race_value = 0n;
		for (const card of mmap_seventh[i]) {
			attr_value |= card.attribute;
			race_value |= card.race;
		}
		condition1 += ` OR (level & 0xffff) == ${i} AND (attribute & ${attr_value} OR race & ${race_value})`;
	}
	const ret = ` AND type & $monster AND NOT type & $extra AND (${condition1})`;
	return ret;
}


// query
function is_string(str) {
	return typeof str === 'string' && str.length > 0;
}

/**
 * Parse param into sqlite statement condition.
 * @param {Object} params 
 * @param {number[]} [id_list]
 * @returns {[string, Object]}
 */
export function generate_condition(params, id_list) {
	let qstr = "";
	const arg = {};
	const key_list = [];
	// primary key
	if (Number.isSafeInteger(params.id)) {
		key_list.push(params.id);
	}
	if (Number.isSafeInteger(params.cid)) {
		key_list.push(cid_table.get(params.cid) ?? -1);
	}
	if (key_list.length) {
		qstr = ` AND ${list_condition('id', 'id', key_list, arg)}`;
		return [qstr, arg];
	}

	// number
	if (Array.isArray(id_list) && id_list.length) {
		qstr += ` AND ${list_condition('id', 'id', id_list, arg)}`;
	}
	if (Number.isSafeInteger(params.tcg)) {
		if (params.tcg) {
			qstr += " AND ot & $ot_mask == $tcg";
		}
		else {
			qstr += " AND ot & $ot_mask != $tcg";
		}
		arg.$ot_mask = 0x3;
		arg.$tcg = 0x2;
	}
	if (Number.isSafeInteger(params.alias)) {
		qstr += " AND alias == $alias";
		arg.$alias = params.alias;
	}
	if (Number.isSafeInteger(params.type) && params.type > 0) {
		qstr += " AND type & $type";
		arg.$type = params.type;
	}
	if (Number.isSafeInteger(params.exact_type) && params.exact_type > 0) {
		qstr += " AND type & $exact_type == $exact_type";
		arg.$exact_type = params.exact_type;
	}
	if (Number.isSafeInteger(params.exclude) && params.exclude > 0) {
		qstr += " AND NOT type & $exclude";
		arg.$exclude = params.exclude;
	}
	if (Number.isSafeInteger(params.spell_type) && params.spell_type > 0) {
		let subtype = params.spell_type;
		let subtype_condition = "type & $stype";
		if (subtype & spell_types.TYPE_NORMAL) {
			subtype_condition += " OR type == $spell";
			subtype = (subtype & ~spell_types.TYPE_NORMAL) >>> 0;
		}
		qstr += ` AND type & $spell AND (${subtype_condition})`;
		arg.$spell = card_types.TYPE_SPELL;
		arg.$stype = subtype;
	}
	if (Number.isSafeInteger(params.trap_type) && params.trap_type > 0) {
		let subtype = params.trap_type;
		let subtype_condition = "type & $ttype";
		if (subtype & trap_types.TYPE_NORMAL) {
			subtype_condition += " OR type == $trap";
			subtype = (subtype & ~trap_types.TYPE_NORMAL) >>> 0;
		}
		qstr += ` AND type & $trap AND (${subtype_condition})`;
		arg.$trap = card_types.TYPE_TRAP;
		arg.$ttype = subtype;
	}
	if (Number.isSafeInteger(params.mention) && card_table.has(params.mention)) {
		if (ambiguous_name_list.has(params.mention)) {
			qstr += `${effect_filter} AND "desc" REGEXP $mention`;
			arg.$mention = `「${escape_regexp(card_table.get(params.mention).tw_name)}」(?!怪獸|魔法|陷阱|卡片|融合怪獸|同步怪獸|超量怪獸|連結怪獸|儀式怪獸|靈擺怪獸|通常|永續|裝備|速攻|儀式魔法|場地|反擊)`;
		}
		else {
			qstr += `${effect_filter} AND "desc" LIKE $mention`;
			arg.$mention = `%「${escape_wildcard(card_table.get(params.mention).tw_name)}」%`;
		}
		arg.$normal = monster_types.TYPE_NORMAL;
		arg.$pendulum = monster_types.TYPE_PENDULUM;
	}
	if (Number.isSafeInteger(params.page_size) && params.page_size > 0) {
		arg.$limit = params.page_size;
		if (Number.isSafeInteger(params.page) && params.page > 0 && Number.isSafeInteger((params.page - 1) * params.page_size)) {
			arg.$offset = (params.page - 1) * params.page_size;
		}
		else {
			arg.$offset = 0;
		}
	}

	// text
	if (is_string(params.keyword)) {
		qstr += ` AND (${name_condition(params.keyword, arg)} OR "desc" LIKE $name ESCAPE '$')`;
	}
	else {
		if (is_string(params.name)) {
			qstr += ` AND ${name_condition(params.name, arg)}`;
		}
		else if (Number.isSafeInteger(params.setcode) && params.setcode > 0) {
			qstr += ` AND ${setcode_condition(params.setcode, arg)}`;
		}
		if (is_string(params.desc)) {
			qstr += ` AND "desc" LIKE $desc ESCAPE '$'`;
			arg.$desc = like_pattern(params.desc);
		}
	}
	if (is_string(params.pack)) {
		if (pack_list[params.pack]) {
			const pack = pack_list[params.pack].filter(x => Number.isSafeInteger(x) && x > 0);
			qstr += ` AND ${list_condition('id', 'pack', pack, arg)}`;
		}
		else if (pre_release.has(params.pack)) {
			qstr += " AND (id BETWEEN $pack_begin AND $pack_end)";
			arg.$pack_begin = pre_release.get(params.pack);
			arg.$pack_end = pre_release.get(params.pack) + 500;
		}
	}

	if (!arg.$cardtype || arg.$cardtype === card_types.TYPE_MONSTER) {
		let is_monster = false;
		if (Number.isSafeInteger(params.material) && card_table.has(params.material)) {
			const material = escape_wildcard(card_table.get(params.material).tw_name);
			let material_condition = "0";
			for (let i = 0; i < 4; i += 1) {
				material_condition += ` OR "desc" LIKE $mat${i} ESCAPE '$'`;
			}
			qstr += ` AND (${material_condition})`;
			arg.$mat0 = `「${material}」+%`;
			arg.$mat1 = `「${material}」（%）+%`;
			arg.$mat2 = `%+「${material}」%`;
			arg.$mat3 = `%「${material}」×%`;
			is_monster = true;
		}

		// atk
		let atk_from = -10;
		let atk_to = -10;
		let atk_condition = "";
		if (Number.isSafeInteger(params.atk_from) && params.atk_from >= -1)
			atk_from = params.atk_from;
		if (Number.isSafeInteger(params.atk_to) && params.atk_to >= -1)
			atk_to = params.atk_to;
		if (atk_from === -1 || atk_to === -1) {
			atk_condition = "atk == $unknown";
			arg.$unknown = -2;
			is_monster = true;
		}
		else if (atk_to >= 0) {
			if (atk_from < 0)
				atk_from = 0;
			atk_condition = "(atk BETWEEN $atk_from AND $atk_to)";
			arg.$atk_from = atk_from;
			arg.$atk_to = atk_to;
			is_monster = true;
		}
		else if (atk_from >= 0) {
			atk_condition = "atk >= $atk_from";
			arg.$atk_from = atk_from;
			is_monster = true;
		}

		// def, exclude link monsters
		let has_def = false;
		let def_from = -10;
		let def_to = -10;
		let def_condition = "";
		if (Number.isSafeInteger(params.def_from) && params.def_from >= -2)
			def_from = params.def_from;
		if (Number.isSafeInteger(params.def_to) && params.def_to >= -1)
			def_to = params.def_to;
		if (def_from === -1 || def_to === -1) {
			def_condition = "def == $unknown";
			arg.$unknown = -2;
			has_def = true;
		}
		else if (def_from === -2) {
			def_condition = "def == atk AND def >= $zero";
			arg.$zero = 0;
			has_def = true;
		}
		else if (def_to >= 0) {
			if (def_from < 0)
				def_from = 0;
			def_condition = "(def BETWEEN $def_from AND $def_to)";
			arg.$def_from = def_from;
			arg.$def_to = def_to;
			has_def = true;
		}
		else if (def_from >= 0) {
			def_condition = "def >= $def_from";
			arg.$def_from = def_from;
			has_def = true;
		}
		if (atk_condition && def_condition) {
			qstr += ` AND (${atk_condition} AND ${def_condition})`;
		}
		else if (atk_condition) {
			qstr += ` AND ${atk_condition}`;
		}
		else if (def_condition) {
			qstr += ` AND ${def_condition}`;
		}
		if (Number.isSafeInteger(params.sum) && params.sum >= 0) {
			qstr += " AND atk >= $zero AND def >= $zero AND atk + def == $sum";
			arg.$zero = 0;
			arg.$sum = params.sum;
			has_def = true;
		}
		if (has_def) {
			qstr += " AND NOT type & $link";
			arg.$link = monster_types.TYPE_LINK;
			is_monster = true;
		}

		// lv, rank, link
		if (Array.isArray(params.level) && params.level.length) {
			qstr += ` AND ${list_condition('level & $level_mask', 'level', params.level, arg)}`;
			arg.$level_mask = 0xffff;
			is_monster = true;
		}
		else {
			let level_from = -10;
			let level_to = -10;
			if (Number.isSafeInteger(params.level_from) && params.level_from >= 0)
				level_from = params.level_from;
			if (Number.isSafeInteger(params.level_to) && params.level_to >= 0)
				level_to = params.level_to;
			if (level_from >= 0 && level_to >= 0) {
				qstr += " AND ((level & $level_mask) BETWEEN $level_from AND $level_to)";
				arg.$level_mask = 0xffff;
				arg.$level_from = level_from;
				arg.$level_to = level_to;
				is_monster = true;
			}
			else if (level_from >= 0) {
				qstr += " AND (level & $level_mask) >= $level_from";
				arg.$level_mask = 0xffff;
				arg.$level_from = level_from;
				is_monster = true;
			}
			else if (level_to >= 0) {
				qstr += " AND (level & $level_mask) <= $level_to";
				arg.$level_mask = 0xffff;
				arg.$level_to = level_to;
				is_monster = true;
			}
		}

		// scale, pendulum monster only
		let has_scale = false;
		const scale_column = "level >> $scale_pos & $scale_mask";
		if (Array.isArray(params.scale) && params.scale.length) {
			qstr += ` AND ${list_condition(scale_column, 'scale', params.scale, arg)}`;
			arg.$scale_pos = 24;
			arg.$scale_mask = 0xff;
			has_scale = true;
		}
		else {
			let scale_from = -10;
			let scale_to = -10;
			if (Number.isSafeInteger(params.scale_from) && params.scale_from >= 0)
				scale_from = params.scale_from;
			if (Number.isSafeInteger(params.scale_to) && params.scale_to >= 0)
				scale_to = params.scale_to;
			if (scale_from >= 0 && scale_to >= 0) {
				qstr += ` AND (${scale_column} BETWEEN $scale_from AND $scale_to)`;
				arg.$scale_pos = 24;
				arg.$scale_mask = 0xff;
				arg.$scale_from = scale_from;
				arg.$scale_to = scale_to;
				has_scale = true;
			}
			else if (scale_from >= 0) {
				qstr += ` AND ${scale_column} >= $scale_from`;
				arg.$scale_pos = 24;
				arg.$scale_mask = 0xff;
				arg.$scale_from = scale_from;
				has_scale = true;
			}
			else if (scale_to >= 0) {
				qstr += ` AND ${scale_column} <= $scale_to`;
				arg.$scale_pos = 24;
				arg.$scale_mask = 0xff;
				arg.$scale_to = scale_to;
				has_scale = true;
			}
		}
		if (has_scale) {
			qstr += " AND type & $pendulum";
			arg.$pendulum = monster_types.TYPE_PENDULUM;
			is_monster = true;
		}

		// attribute, race
		if (Number.isSafeInteger(params.attribute)) {
			qstr += " AND attribute & $attribute";
			arg.$attribute = params.attribute;
			is_monster = true;
		}
		if (typeof params.race === 'bigint' && params.race > 0) {
			qstr += " AND race & $race";
			arg.$race = BigInt.asUintN(64, params.race);
			is_monster = true;
		}
		// marker
		if (Number.isSafeInteger(params.marker)) {
			qstr += " AND type & $link";
			arg.$link = monster_types.TYPE_LINK;
			if (Number.isSafeInteger(params.marker_operator) && params.marker_operator)
				qstr += " AND def & $marker == $marker";
			else
				qstr += " AND def & $marker";
			arg.$marker = params.marker;
			is_monster = true;
		}
		if (is_monster) {
			qstr += " AND type & $cardtype";
			arg.$cardtype = card_types.TYPE_MONSTER;
		}
	}
	return [qstr, arg];
}

/**
 * @param {string[]} [files] 
 */
export async function init_query(files) {
	if (!files) {
		const current_path = `${import.meta.dirname}/db/query.cdb`;
		const temp1 = `${import.meta.dirname}/db/main.cdb`;
		const temp2 = `${import.meta.dirname}/db/pre.cdb`;
		try {
			await Promise.all([writeFile(temp1, await fetch_db(db_url1)), writeFile(temp2, await fetch_db(db_url2))]);
		}
		catch (error) {
			console.error(error);
			return;
		}
		if (!merge_db(temp1, [temp2])) {
			return;
		}
		for (const db of db_list) {
			db.close();
		}
		db_list.length = 0;
		await rm(current_path, { force: true });
		await rename(temp1, current_path);
		db_list.push(sqlite3_open(current_path));
	}
	else {
		for (const db of db_list) {
			db.close();
		}
		db_list.length = 0;
		for (const file of files) {
			db_list.push(sqlite3_open(file));
		}
	}
	// refresh multimap of No.101 ~ No.107
	multimap_clear(mmap_seventh);
	const seventh_cards = query(stmt_seventh, arg_seventh);
	seventh_cards.sort((c1, c2) => zh_collator.compare(c1.tw_name, c2.tw_name));
	for (const card of seventh_cards) {
		multimap_insert(mmap_seventh, card.level, card);
	}
	// refresh card table
	const normalized_names = new Map();
	ambiguous_name_list.clear();
	card_table.clear();
	for (const card of query()) {
		card_table.set(card.id, card);
		if (setname_table[card.tw_name]) {
			ambiguous_name_list.add(card.id);
		}
		const key = (card.cid === CID_BLACK_LUSTER_SOLDIER) ? `${card.tw_name.toLowerCase()}${bls_postfix['zh-tw']}` : card.tw_name.toLowerCase();
		if (normalized_names.has(key)) {
			console.error('duplicate normalized name:', card.id, key);
		}
		normalized_names.set(key, card.id);
	}
}

/**
 * Check if the card has an official card name.
 * @param {Card} card
 * @returns {boolean}
 */
export function is_released(card) {
	return !!(card.jp_name || card.en_name);
}

/**
 * Check if `card.setcode` contains `value`.
 * @param {Card} card 
 * @param {number} value 
 * @returns {boolean}
 */
export function is_setcode(card, value) {
	const settype = value & 0x0fff;
	const setsubtype = value & 0xf000;
	for (const x of card.setcode) {
		if ((x & 0x0fff) === settype && (x & setsubtype) === setsubtype)
			return true;
	}
	return false;
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
	const qstr = `${stmt_default} AND alias == $alias`;
	const arg = {
		...arg_default,
		$alias: alias,
	};
	return query(qstr, arg);
}

/**
 * Query card from all databases with JSON object `params`.
 * @param {Object} params 
 * @returns {Object}
 */
export function query_card(params) {
	if (Number.isSafeInteger(params.id) || Number.isSafeInteger(params.cid)) {
		const [condition, arg_condition] = generate_condition(params);
		const stmt = `${stmt_base}${condition}`;
		const arg = {
			...arg_base,
			...arg_condition,
		};
		const result = query(stmt, arg);
		const total = result.length;
		return { result, total };
	}
	const [condition, arg_condition] = generate_condition(params);
	const stmt1 = `${stmt_default}${condition}`;
	const arg1 = {
		...arg_default,
		...arg_condition,
	};
	const result = query(stmt1, arg1);
	if (is_string(params.pack, MAX_STRING_LENGTH) && pack_list[params.pack]) {
		const pack = pack_list[params.pack];
		const index_table = new Map();
		for (let i = 0; i < pack.length; i += 1) {
			if (Number.isSafeInteger(pack[i]) && pack[i] > 0) {
				index_table.set(pack[i], i);
			}
		}
		for (const card of result) {
			card.pack_index = index_table.get(card.id);
		}
		if (result.length > 1) {
			result.sort((a, b) => a.pack_index - b.pack_index);
		}
	}
	let total = result.length;
	if (arg1.$limit) {
		const command = `${stmt_count}${condition};`;
		const arg2 = { ...arg1 };
		delete arg2.$limit;
		delete arg2.$offset;
		total = 0;
		for (const db of db_list) {
			const st = db.prepare(command);
			st.setReturnArrays(true);
			total += st.all(arg2)[0][0];
		}
	}
	const offset = arg1.$offset ?? 0;
	return { result, offset, total };
}

/**
 * Get a card with id from all databases.
 * @param {number|string} id 
 * @returns {?Card}
 */
export function get_card(id) {
	if (typeof id === 'string')
		id = Number.parseInt(id, 10);
	if (!Number.isSafeInteger(id))
		return null;
	const card = card_table.get(id);
	return card ?? null;
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
	if (card.type & monster_types.TYPES_EXTRA)
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


// print
/**
 * Print the ATK or DEF of a card.
 * @param {number} x 
 * @returns {string}
 */
export function print_ad(x) {
	if (x === -2)
		return '?';
	else
		return `${x}`;
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
			data += `:small_blue_diamond:${card.scale}/${card.scale}:small_orange_diamond:${newline}`;
		}
		if (card.type & monster_types.TYPE_LINK) {
			let marker_text = '';
			for (let marker = link_markers.LINK_MARKER_TOP_LEFT; marker <= link_markers.LINK_MARKER_TOP_RIGHT; marker <<= 1) {
				if (card.marker & marker)
					marker_text += strings.marker_char[marker];
				else
					marker_text += strings.marker_char['default'];
			}
			marker_text += newline;

			if (card.marker & link_markers.LINK_MARKER_LEFT)
				marker_text += strings.marker_char[link_markers.LINK_MARKER_LEFT];
			else
				marker_text += strings.marker_char['default'];

			marker_text += strings.marker_char['default'];

			if (card.marker & link_markers.LINK_MARKER_RIGHT)
				marker_text += strings.marker_char[link_markers.LINK_MARKER_RIGHT];
			else
				marker_text += strings.marker_char['default'];

			marker_text += newline;

			for (let marker = link_markers.LINK_MARKER_BOTTOM_LEFT; marker <= link_markers.LINK_MARKER_BOTTOM_RIGHT; marker <<= 1) {
				if (card.marker & marker)
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

	let md_status = '';
	if (card.md_rarity)
		md_status = `MD：${md_rarity[card.md_rarity]}\n`;

	let lfstr = '';
	let lfstr_ocg = '';
	let lfstr_tcg = '';
	let lfstr_md = '';
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

	let genesys_status = '';
	if (card.cid && genesys_point[card.cid]) {
		genesys_status = `Genesys：${genesys_point[card.cid]}\n`;
	}
	const card_text = `**${card_name}**\n${other_name}${md_status}${genesys_status}${lfstr}${print_data(card, '\n', locale)}${desc}\n`;
	return card_text;
}


// table
/**
 * Create the [name, id] table of region `request_locale`
 * @param {string} request_locale 
 * @returns {Map<string, number>}
 */
export function create_choice(request_locale) {
	if (!complete_name_table[request_locale])
		return new Map();
	const inverse = inverse_mapping(complete_name_table[request_locale]);
	const collator = new Intl.Collator(collator_locale[request_locale]);
	const entries = [...inverse].sort((a, b) => collator.compare(a[0], b[0]));
	for (const entry of entries) {
		entry[1] = cid_table.get(entry[1]);
	}
	return new Map(entries);
}

/**
 * Create the [name, id] table for pre-release cards.
 * @returns {Map<string, number>}
 */
export function create_choice_prerelease() {
	const inverse_table = new Map();
	const stmt_pre = `${stmt_default} AND id > $ub`;
	const arg_pre = {
		...arg_default,
		$ub: MAX_CARD_ID,
	};
	const re_kanji = /※.*/;
	const cards = query(stmt_pre, arg_pre);
	for (const card of cards) {
		if (card.cid) {
			continue;
		}
		const res = card.text.desc.match(re_kanji);
		const kanji = res ? res[0] : '';
		if (inverse_table.has(card.tw_name) || kanji && inverse_table.has(kanji)) {
			console.error('choice_prerelease', card.id);
			return new Map();
		}
		inverse_table.set(card.tw_name, card.id);
		if (kanji)
			inverse_table.set(kanji, card.id);
	}
	return new Map([...inverse_table].sort(zh_compare))
}

/**
 * Create the [name, id] table from database file.
 * @returns {Map<string, number>}
 */
export function create_choice_db() {
	const inverse_table = new Map();
	const re_kanji = /※.*/;
	for (const card of card_table.values()) {
		if (!card.cid) {
			continue;
		}
		const res = card.text.desc.match(re_kanji);
		const kanji = res ? res[0] : '';
		let key = card.tw_name;
		if (card.cid === CID_BLACK_LUSTER_SOLDIER) {
			key += bls_postfix['zh-tw'];
		}
		if (inverse_table.has(key) || kanji && inverse_table.has(kanji)) {
			console.error('choice_db', card.id);
			return new Map();
		}
		inverse_table.set(key, card.id);
		if (kanji)
			inverse_table.set(kanji, card.id);
	}
	return new Map([...inverse_table].sort(zh_compare))
}

export function create_name_table() {
	const table1 = new Map();
	for (const card of card_table.values()) {
		if (card.cid)
			table1.set(card.cid, card.tw_name);
	}
	table1.set(CID_BLACK_LUSTER_SOLDIER, `${table1.get(CID_BLACK_LUSTER_SOLDIER)}${bls_postfix['zh-tw']}`);
	if (table1.size !== cid_table.size)
		console.error('invalid name_table_tw:', cid_table.size, table1.size);
	return table1;
}

export {
	card_types, monster_types, spell_types, trap_types,
	link_markers, races, attributes,
} from './ygo-constant.mjs';

export * from './ygo-json-loader.mjs';

export {
	select_all, select_id, select_name,
	base_filter, no_alt_filter, default_filter, effect_filter,
	stmt_default, stmt_base, stmt_no_alias,
	arg_default, arg_base, arg_no_alias,
} from './ygo-sqlite.mjs';

export * from './ygo-utility.mjs';
