import { rename, rm, writeFile } from 'node:fs/promises';
import { ltable_ocg, ltable_tcg, ltable_md, pack_list, pre_release, genesys_point, setname_table, load_name_table, ruby_table, id_to_cid } from './ygo-json-loader.mjs';
import { lang, bls_postfix, official_name, game_name } from './ygo-json-loader.mjs';
import { cid_table, name_table, md_table, md_card_list } from './ygo-json-loader.mjs';
import { escape_regexp, escape_wildcard, zh_collator, zh_compare } from './ygo-utility.mjs';
import { db_url1, db_url2, fetch_db } from './ygo-fetch.mjs';
import { card_types, monster_types, link_markers, md_rarity, spell_colors, trap_colors, CID_BLACK_LUSTER_SOLDIER, spell_types, trap_types, marker_char } from "./ygo-constant.mjs";
import { arg_full, arg_seventh, effect_filter, full_columns, full_filter, full_tables, stmt_full_count, stmt_full_default, stmt_seventh } from './ygo-sqlite.mjs';
import { like_pattern, name_condition, list_condition, alter_db, merge_db, query_db_v2, setcode_condition, sqlite3_open } from './ygo-sqlite.mjs';

export const regexp_mention = `(?<=「)[^「」]*「?[^「」]*」?[^「」]*(?=」)`;
const RESULT_PER_PAGE = 50;

/**
 * @type {import('node:sqlite').DatabaseSync}
 */
let db = null;

/**
 * @typedef {object} Entry
 * @property {number} id
 * @property {number} ot
 * @property {number} alias
 * @property {number} rule_code
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
 * @typedef {object} CardText
 * @property {string} desc
 * @property {string} [db_desc]
 */

/**
 * @typedef {object} Card
 * @property {number} id
 * @property {number} [cid]
 * @property {number} [rule_code]
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
 * @type {Map<number, Card[]>}
 */
const multimap_seventh = new Map();
const card_names = new Map();

//workaround
await init_query();


/**
 * @param {Entry} cdata 
 * @returns {Card}
 */
function generate_card(cdata) {
	let id = cdata.id;
	let artid = 0;
	if (cdata.alias) {
		id = cdata.alias;
		artid = cdata.id;
	}
	const card = Object.create(null);
	card.id = id;
	// table lookup for alternative art
	if (id_to_cid.has(id))
		card.cid = id_to_cid.get(id);
	if (cdata.rule_code)
		card.rule_code = cdata.rule_code;
	card.tw_name = cdata.name;
	if (card.cid) {
		for (const [locale, prop] of Object.entries(official_name)) {
			if (name_table[locale][card.cid])
				card[prop] = name_table[locale][card.cid];
			else if (md_table[locale] && md_table[locale][card.cid])
				card[game_name[locale]] = md_table[locale][card.cid];
			if (locale === 'ja' && ruby_table[card.cid])
				card.jp_ruby = ruby_table[card.cid];
		}
	}
	for (const column in cdata) {
		switch (column) {
			case "id":
			case "cid":
			case "alias":
			case "rule_code":
			case "name":
			case "desc":
				continue;
			case "scale":
				if (cdata.type & monster_types.TYPE_PENDULUM)
					card.scale = cdata.scale;
				break;
			case "def":
				if (cdata.type & monster_types.TYPE_LINK)
					card.marker = cdata.def;
				else
					card.def = cdata.def;
				break;
			default:
				card[column] = cdata[column];
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
		if (!multimap_seventh.has(i))
			continue;
		let attr_value = 0;
		let race_value = 0n;
		for (const card of multimap_seventh.get(i)) {
			attr_value |= card.attribute;
			race_value |= card.race;
		}
		condition1 += ` OR level = ${i} AND (attribute & ${attr_value} OR race & ${race_value})`;
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
 * @param {object} params 
 * @param {number[]} [id_list]
 * @returns {[string, object]}
 */
export function generate_condition(params, id_list) {
	let qstr = "";
	const arg = {};
	const key_condition = [];
	// primary key
	if (Number.isSafeInteger(params.id)) {
		key_condition.push('id = $id');
		arg.$id = params.id;
	}
	if (Number.isSafeInteger(params.cid)) {
		key_condition.push('cid = $cid');
		arg.$cid = params.cid;
	}
	if (key_condition.length) {
		qstr = ` AND (${key_condition.join(' OR ')})`;
		return [qstr, arg];
	}

	// number
	if (Array.isArray(id_list) && id_list.length) {
		qstr += ` AND ${list_condition('id', 'id', id_list, arg)}`;
	}
	if (Number.isSafeInteger(params.ot) && params.ot > 0) {
		qstr += " AND ot & $ot_mask = $ot";
		arg.$ot_mask = 0x3;
		arg.$ot = params.ot;
	}
	if (Number.isSafeInteger(params.ot_exclude) && params.ot_exclude > 0) {
		qstr += " AND ot & $ot_mask != $ot_exclude";
		arg.$ot_mask = 0x3;
		arg.$ot_exclude = params.ot_exclude;
	}
	if (Number.isSafeInteger(params.type) && params.type > 0) {
		qstr += " AND type & $type";
		arg.$type = params.type;
	}
	if (Number.isSafeInteger(params.monster_type) && params.monster_type > 0) {
		qstr += " AND type & $monster";
		arg.$monster = card_types.TYPE_MONSTER;
		if (Number.isSafeInteger(params.monster_type_op) && params.monster_type_op)
			qstr += " AND type & $monster_type = $monster_type";
		else
			qstr += " AND type & $monster_type";
		arg.$monster_type = params.monster_type;
	}
	if (Number.isSafeInteger(params.excluded_type) && params.excluded_type > 0) {
		qstr += " AND NOT type & $excluded_type";
		arg.$excluded_type = params.excluded_type;
	}
	if (Number.isSafeInteger(params.spell_type) && params.spell_type > 0) {
		let subtype = params.spell_type;
		let subtype_condition = "type & $stype";
		if (subtype & spell_types.TYPE_NORMAL) {
			subtype_condition += " OR type = $spell";
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
			subtype_condition += " OR type = $trap";
			subtype = (subtype & ~trap_types.TYPE_NORMAL) >>> 0;
		}
		qstr += ` AND type & $trap AND (${subtype_condition})`;
		arg.$trap = card_types.TYPE_TRAP;
		arg.$ttype = subtype;
	}
	if (Number.isSafeInteger(params.mention)) {
		const tw_name = card_names.get(params.mention);
		if (tw_name) {
			if (Object.hasOwn(setname_table, tw_name)) {
				qstr += `${effect_filter} AND "desc" REGEXP $mention`;
				arg.$mention = `「${escape_regexp(tw_name)}」(?!怪|魔|陷|卡|融合怪獸|同步怪獸|超量怪獸|連結怪獸|儀式怪獸|靈擺怪獸|通常|永續|裝備|速攻|儀式魔法|場地|反擊)`;
			}
			else {
				qstr += `${effect_filter} AND "desc" LIKE $mention ESCAPE '$'`;
				arg.$mention = `%「${escape_wildcard(tw_name)}」%`;
			}
			arg.$normal = monster_types.TYPE_NORMAL;
			arg.$pendulum = monster_types.TYPE_PENDULUM;
		}
	}
	if (Number.isSafeInteger(params.md_rarity)) {
		qstr += " AND md_rarity = $md_rarity";
		arg.$md_rarity = params.md_rarity;
	}
	if (typeof params.pack === 'string' && Object.hasOwn(pack_list, params.pack)) {
		const pack = pack_list[params.pack].filter(x => Number.isSafeInteger(x) && x > 0);
		qstr += ` AND ${list_condition('id', 'pack', pack, arg)}`;
	}
	else if (typeof params.pack === 'string' && Object.hasOwn(pre_release, params.pack)) {
		qstr += " AND (id BETWEEN $pack_begin AND $pack_end)";
		arg.$pack_begin = pre_release[params.pack];
		arg.$pack_end = pre_release[params.pack] + 500;
	}
	else if (Number.isSafeInteger(params.limit) && params.limit > 0) {
		arg.$limit = params.limit;
		if (Number.isSafeInteger(params.offset) && params.offset >= 0) {
			arg.$offset = params.offset;
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
	if (is_string(params.en_name)) {
		qstr += ` AND en_name LIKE $en_name ESCAPE '$'`;
		arg.$en_name = params.en_name;
	}
	if (is_string(params.jp_name)) {
		qstr += ` AND jp_name LIKE $jp_name ESCAPE '$'`;
		arg.$jp_name = params.jp_name;
	}
	if (is_string(params.jp_ruby)) {
		qstr += ` AND jp_ruby LIKE $jp_ruby ESCAPE '$'`;
		arg.$jp_ruby = params.jp_ruby;
	}

	if (!arg.$cardtype || arg.$cardtype === card_types.TYPE_MONSTER) {
		let is_monster = false;
		if (Number.isSafeInteger(params.material)) {
			const tw_name = card_names.get(params.material);
			if (tw_name) {
				const material = escape_wildcard(tw_name);
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
			atk_condition = "atk = $unknown";
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
			def_condition = "def = $unknown";
			arg.$unknown = -2;
			has_def = true;
		}
		else if (def_from === -2) {
			def_condition = "def = atk AND def >= $zero";
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
			qstr += " AND atk >= $zero AND def >= $zero AND atk + def = $sum";
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
			qstr += ` AND ${list_condition('level', 'level', params.level, arg)}`;
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
				qstr += " AND (level BETWEEN $level_from AND $level_to)";
				arg.$level_from = level_from;
				arg.$level_to = level_to;
				is_monster = true;
			}
			else if (level_from >= 0) {
				qstr += " AND level >= $level_from";
				arg.$level_from = level_from;
				is_monster = true;
			}
			else if (level_to >= 0) {
				qstr += " AND level <= $level_to";
				arg.$level_to = level_to;
				is_monster = true;
			}
		}

		// scale, pendulum monster only
		let has_scale = false;
		if (Array.isArray(params.scale) && params.scale.length) {
			qstr += ` AND ${list_condition('scale', 'scale', params.scale, arg)}`;
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
				qstr += ` AND (scale BETWEEN $scale_from AND $scale_to)`;
				arg.$scale_from = scale_from;
				arg.$scale_to = scale_to;
				has_scale = true;
			}
			else if (scale_from >= 0) {
				qstr += ` AND scale >= $scale_from`;
				arg.$scale_from = scale_from;
				has_scale = true;
			}
			else if (scale_to >= 0) {
				qstr += ` AND scale <= $scale_to`;
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
		if (Number.isSafeInteger(params.attribute) && params.attribute > 0) {
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
		if (Number.isSafeInteger(params.marker) && params.marker > 0) {
			qstr += " AND type & $link";
			arg.$link = monster_types.TYPE_LINK;
			if (Number.isSafeInteger(params.marker_op) && params.marker_op)
				qstr += " AND def & $marker = $marker";
			else
				qstr += " AND def & $marker";
			arg.$marker = params.marker;
			is_monster = true;
		}
		if (is_monster) {
			qstr += " AND type & $monster";
			arg.$monster = card_types.TYPE_MONSTER;
		}
	}
	return [qstr, arg];
}

/**
 * @param {string[]?} files
 */
export async function init_query(files = null) {
	if (files === null || files.length === 0) {
		const current_path = `${import.meta.dirname}/db/query.cdb`;
		const base = `${import.meta.dirname}/db/main.cdb`;
		const ext1 = `${import.meta.dirname}/db/pre.cdb`;
		try {
			const task1 = fetch_db(db_url1).then(data => writeFile(base, data));
			const task2 = fetch_db(db_url2).then(data => writeFile(ext1, data));
			await Promise.all([task1, task2]);
		}
		catch (error) {
			console.error(error);
			return;
		}
		const full_db = merge_db(base, [ext1]);
		if (!full_db) {
			return;
		}
		alter_db(full_db);
		load_name_table(full_db);
		full_db.close();
		db?.close();
		await rm(current_path, { force: true });
		await rename(base, current_path);
		db = sqlite3_open(current_path);
		await rm(ext1, { force: true });
	}
	else {
		db?.close();
		const full_db = merge_db(files[0], files.slice(1));
		if (!full_db) {
			return;
		}
		alter_db(full_db);
		load_name_table(full_db);
		full_db.close();
		db = sqlite3_open(files[0]);
	}
	// refresh multimap of No.101 ~ No.107
	multimap_seventh.clear();
	const seventh_cards = query(stmt_seventh, arg_seventh);
	seventh_cards.sort((c1, c2) => zh_collator.compare(c1.tw_name, c2.tw_name));
	for (const card of seventh_cards) {
		if (!multimap_seventh.has(card.level))
			multimap_seventh.set(card.level, []);
		multimap_seventh.get(card.level).push(card);
	}
	const stmt1 = `SELECT id, name FROM ${full_tables} WHERE 1 = 1${full_filter}`;
	for (const entry of query_db_v2(db, stmt1, arg_full)) {
		card_names.set(entry.id, entry.name);
	}
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
 * @param {object} arg 
 * @returns {Card[]}
 */
export function query(qstr = stmt_full_default, arg = arg_full) {
	const ret = [];
	for (const cdata of query_db_v2(db, qstr, arg)) {
		ret.push(generate_card(cdata));
	}
	return ret;
}

/**
 * Query card from all databases with JSON object `params`.
 * @param {object} params 
 */
export function query_card(params) {
	const meta = {
		total: 0,
		limit: 0,
		offset: 0,
	};
	const [condition, arg_condition] = generate_condition(params);
	if (Object.keys(arg_condition).length === 0) {
		return { result: [], meta };
	}
	if (Number.isSafeInteger(params.id) || Number.isSafeInteger(params.cid)) {
		const stmt = `SELECT ${full_columns} FROM ${full_tables} WHERE NOT (type & $token) AND (cid IS NOT NULL OR alias != 0 OR id > $max_id)${condition}`;
		const arg = {
			...arg_full,
			...arg_condition,
		};
		const result = query(stmt, arg);
		meta.total = result.length;
		return { result, meta };
	}
	const stmt1 = `${stmt_full_default}${condition}`;
	const arg1 = {
		...arg_full,
		...arg_condition,
	};
	const result = query(stmt1, arg1);
	meta.total = result.length;
	if (result.length === 0) {
		return { result, meta };
	}
	let is_sorted = false;
	if (typeof params.pack === 'string' && Object.hasOwn(pack_list, params.pack)) {
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
		result.sort((a, b) => a.pack_index - b.pack_index);
		is_sorted = true;
		meta.pack = params.pack;
	}
	else if (typeof params.pack === 'string' && Object.hasOwn(pre_release, params.pack)) {
		is_sorted = true;
		meta.pack = params.pack;
	}
	else if (arg_condition.$limit) {
		meta.limit = arg_condition.$limit;
		if (arg_condition.$offset >= 0) {
			meta.offset = arg_condition.$offset;
		}
	}
	if (meta.limit > 0) {
		const command = `${stmt_full_count}${condition};`;
		const arg2 = { ...arg1 };
		delete arg2.$limit;
		delete arg2.$offset;
		const st = db.prepare(command);
		st.setReturnArrays(true);
		const rows = st.all(arg2);
		meta.total = rows[0]?.[0] ?? 0;
		return { result, meta };
	}
	if (Number.isSafeInteger(params.page) && params.page > 0) {
		if (!is_sorted) {
			result.sort(compare_card);
		}
		const begin = (params.page - 1) * RESULT_PER_PAGE;
		const section = result.slice(begin, begin + RESULT_PER_PAGE);
		meta.total = result.length;
		return { result: section, meta };
	}
	return { result, meta };
}

/**
 * The compare function of Card.
 * @param {Card} a 
 * @param {Card} b 
 * @returns {number}
 */
export function compare_card(a, b) {
	if (a.color !== b.color) {
		return a.color - b.color;
	}
	if (a.level !== b.level) {
		return b.level - a.level;
	}
	return zh_collator.compare(a.tw_name, b.tw_name);
}

/**
 * @param {string} target_name 
 * @param {string} locale 
 * @returns {(card: Card) => number}
 */
function get_match_function(target_name, locale) {
	if (locale === 'en') {
		return (card) => {
			const en_name = card.en_name ?? card.md_name_en;
			return en_name.toLowerCase() === target_name ? 1 : 0;
		};
	}
	return card => card.tw_name.toLowerCase() === target_name ? 1 : 0;
}

/**
 * @param {string?} name 
 * @param {string} locale 
 * @returns {(a: Card, b: Card) => number}
 */
// eslint-disable-next-line no-unused-vars
function get_compare_function(name, locale) {
	const target_name = name?.toLowerCase();
	if (!target_name) {
		return compare_card;
	}
	const match = get_match_function(target_name, locale);
	return (a, b) => {
		const scoreA = match(a);
		const scoreB = match(b);
		if (scoreA !== scoreB) {
			return scoreB - scoreA;
		}
		return compare_card(a, b);
	}
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
	const stmt_id = `${stmt_full_default} AND id = $id;`;
	const arg_id = {
		...arg_full,
		$id: id,
	};
	const result = query(stmt_id, arg_id);
	if (result.length === 0)
		return null;
	return result[0];
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
	if (card.ot === 2) {
		return 'en';
	}
	if (card.jp_name) {
		return 'ja';
	}
	if (card.md_rarity) {
		return 'md';
	}
	return 'ja';
}

/**
 * Get No.101 ~ No.107 Xyz Monsters with the same race or attribute.
 * @param {Card} card 
 * @returns {Card[]}
 */
export function get_seventh_xyz(card) {
	if (!(card.type & card_types.TYPE_MONSTER))
		return [];
	if (card.type & monster_types.TYPES_EXTRA)
		return [];
	if (!multimap_seventh.has(card.level))
		return [];
	const result = [];
	for (const seventh of multimap_seventh.get(card.level)) {
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
					marker_text += marker_char[marker];
				else
					marker_text += marker_char['default'];
			}
			marker_text += newline;

			if (card.marker & link_markers.LINK_MARKER_LEFT)
				marker_text += marker_char[link_markers.LINK_MARKER_LEFT];
			else
				marker_text += marker_char['default'];

			marker_text += marker_char.center;

			if (card.marker & link_markers.LINK_MARKER_RIGHT)
				marker_text += marker_char[link_markers.LINK_MARKER_RIGHT];
			else
				marker_text += marker_char['default'];

			marker_text += newline;

			for (let marker = link_markers.LINK_MARKER_BOTTOM_LEFT; marker <= link_markers.LINK_MARKER_BOTTOM_RIGHT; marker <<= 1) {
				if (card.marker & marker)
					marker_text += marker_char[marker];
				else
					marker_text += marker_char['default'];
			}
			marker_text += newline;
			data += marker_text;
		}
	}
	else if (card.type & card_types.TYPE_SPELL) {
		const extype = card.type & ~card_types.TYPE_SPELL;
		const mtype = `${strings.type_name[card_types.TYPE_SPELL]}`;
		const subtype = strings.type_name[extype] ? `/${strings.type_name[extype]}` : `/???`;
		data = `[${mtype}${subtype}]${newline}`;
	}
	else if (card.type & card_types.TYPE_TRAP) {
		const extype = card.type & ~card_types.TYPE_TRAP;
		const mtype = `${strings.type_name[card_types.TYPE_TRAP]}`;
		const subtype = strings.type_name[extype] ? `/${strings.type_name[extype]}` : `/???`;
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
	let lfstr_ocg;
	let lfstr_tcg;
	let lfstr_md;
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
 * Create the [name, id] table for pre-release cards.
 * @returns {Map<string, number>}
 */
export function create_choice_prerelease() {
	const choices = new Map();
	const stmt_pre = `${stmt_full_default} AND cid IS NULL;`;
	const re_kanji = /※.*/;
	const cards = query(stmt_pre);
	for (const card of cards) {
		const res = card.text.desc.match(re_kanji);
		const kanji = res ? res[0] : '';
		if (choices.has(card.tw_name) || kanji && choices.has(kanji)) {
			console.error('choice_prerelease', card.id);
			return new Map();
		}
		choices.set(card.tw_name, card.id);
		if (kanji)
			choices.set(kanji, card.id);
	}
	return new Map([...choices].sort(zh_compare))
}

/**
 * Create the [name, id] table from database file.
 * @returns {Map<string, number>}
 */
export function create_choice_db() {
	const choices = new Map();
	const re_kanji = /※.*/;
	const stmt_db = `${stmt_full_default} AND cid IS NOT NULL;`;
	for (const card of query(stmt_db)) {
		const res = card.text.desc.match(re_kanji);
		const kanji = res ? res[0] : '';
		let key = card.tw_name;
		if (card.cid === CID_BLACK_LUSTER_SOLDIER) {
			key += bls_postfix['zh-tw'];
		}
		if (choices.has(key) || kanji && choices.has(kanji)) {
			console.error('choice_db', card.id);
			return new Map();
		}
		choices.set(key, card.id);
		if (kanji)
			choices.set(kanji, card.id);
	}
	return new Map([...choices].sort(zh_compare))
}

export function create_name_table() {
	const table1 = new Map();
	const stmt_name = `${stmt_full_default} AND cid IS NOT NULL;`;
	for (const card of query(stmt_name)) {
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

export * from './ygo-utility.mjs';
