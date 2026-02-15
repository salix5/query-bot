import { DatabaseSync } from "node:sqlite";
import { monster_types } from "./ygo-constant.mjs";
import { inverse_mapping } from "./ygo-utility.mjs";
import { id_to_cid, extra_setcodes, setname_table } from "./ygo-json-loader.mjs";

export {
	CID_RITUAL_BLS,
	CID_BLACK_LUSTER_SOLDIER,
	MAX_CARD_ID,
	card_types,
	monster_types,
	spell_types,
	trap_types,
	races,
	attributes,
	link_markers,
} from './ygo-constant.mjs';

export const CARD_ARTWORK_VERSIONS_OFFSET = 20;
export const ID_BLACK_LUSTER_SOLDIER = 5405695;
export const ALT_DARK_MAGICIAN = 36996508;
export const ALT_POLYMERIZATION = 27847700;

// excluded cards
export const ID_TYLER_THE_GREAT_WARRIOR = 68811206;
export const ID_DECOY = 20240828;

const column_names = `id, datas.ot, datas.alias, datas.setcode, datas.type, datas.atk, datas.def, datas.level, datas.race, datas.attribute, texts.name, texts."desc"`;
export const select_all = `SELECT ${column_names} FROM datas JOIN texts USING (id) WHERE 1 = 1`;
export const select_id = `SELECT id FROM datas JOIN texts USING (id) WHERE 1 = 1`;
export const select_name = `SELECT id, texts.name FROM datas JOIN texts USING (id) WHERE 1 = 1`;
export const select_count = `SELECT count(*) FROM datas JOIN texts USING (id) WHERE 1 = 1`;

export const base_filter = ` AND NOT id IN ($tyler, $decoy) AND NOT type & $token`;
export const no_alt_filter = ` AND (id = $luster OR abs(id - alias) >= $artwork_offset)`;
export const default_filter = `${base_filter}${no_alt_filter}`;
export const effect_filter = ` AND (NOT type & $normal OR type & $pendulum)`;

export const stmt_default = `${select_all}${default_filter}`;
export const stmt_count = `${select_count}${default_filter}`;
export const stmt_full_default = `SELECT ${column_names} FROM datas JOIN texts USING (id) LEFT JOIN card_names USING (id) WHERE 1 = 1${default_filter}`;
export const stmt_full_count = `SELECT count(*) FROM datas JOIN texts USING (id) LEFT JOIN card_names USING (id) WHERE 1 = 1${default_filter}`;
export const arg_default = {
	$tyler: ID_TYLER_THE_GREAT_WARRIOR,
	$decoy: ID_DECOY,
	$luster: ID_BLACK_LUSTER_SOLDIER,
	$artwork_offset: CARD_ARTWORK_VERSIONS_OFFSET,
	$token: monster_types.TYPE_TOKEN,
};

export const stmt_base = `${select_all}${base_filter}`;
export const arg_base = {
	$tyler: ID_TYLER_THE_GREAT_WARRIOR,
	$decoy: ID_DECOY,
	$token: monster_types.TYPE_TOKEN,
};

const over_hundred = '(name like $n101 OR name like $n102 OR name like $n103 OR name like $n104 OR name like $n105 OR name like $n106 OR name like $n107)';
export const stmt_seventh = `${stmt_default} AND type & $xyz AND ${over_hundred}`;
export const arg_seventh = {
	...arg_default,
	$xyz: monster_types.TYPE_XYZ,
};
for (let i = 0; i < 7; i += 1) {
	arg_seventh[`$n${101 + i}`] = `%No.${101 + i}%`;
}

const stmt_no_alias = `SELECT id FROM datas JOIN texts USING (id) WHERE NOT type & $token AND alias = $none`;
const arg_no_alias = {
	$token: monster_types.TYPE_TOKEN,
	$none: 0,
};
const stmt_attach = `ATTACH DATABASE ? AS sub;`;
const stmt_detach = `DETACH DATABASE sub;`;
const stmt_merge = `BEGIN TRANSACTION;
INSERT OR REPLACE INTO datas SELECT * FROM sub.datas;
INSERT OR REPLACE INTO texts SELECT * FROM sub.texts;
COMMIT;`;

export const re_wildcard = /(?<!\$)[%_]/;
const replace_dollar = /\$(?![%_])/g;
const replace_escape = /\$(?=[%_])/g;

/**
 * @type {Map<number, number[]>}
 */
const code_table = new Map();
for (const [key, list] of Object.entries(extra_setcodes)) {
	for (const code of list) {
		if (!code_table.has(code))
			code_table.set(code, []);
		const id_list = code_table.get(code);
		id_list.push(Number.parseInt(key, 10));
	}
}

const normalized_setname_table = {};
for (const [name, code] of Object.entries(setname_table)) {
	normalized_setname_table[name.toLowerCase()] = code;
}

/**
 * @typedef {object} Entry
 * @property {number} id
 * @property {number} ot
 * @property {number} alias
 * @property {number[]} setcode
 * @property {number} type
 * @property {number} atk
 * @property {number} def
 * @property {number} level
 * @property {number} scale
 * @property {bigint} race
 * @property {number} attribute
 * 
 * @property {string} name
 * @property {string} desc
 */

/**
 * @param {string} pattern 
 * @param {string} str 
 * @returns 
 */
function regexp_test(pattern, str) {
	try {
		const re = new RegExp(pattern, 'u');
		return re.test(str) ? 1 : 0;
	}
	catch {
		return 0;
	}
}

/**
 * @param {bigint} value 
 * @param {bigint} setcode 
 * @returns {number}
 */
function setcode_match(value, setcode) {
	if (setcode === 0n || value === 0n)
		return 0;
	const setname = value & 0x0fffn;
	const settype = value & 0xf000n;
	for (let i = 0n; i < 4n; i += 1n) {
		const section = (setcode >> (i * 16n)) & 0xffffn;
		if ((section & 0x0fffn) === setname && (section & settype) === settype)
			return 1;
	}
	return 0;
}

/**
 * Open a database file.
 * @param {string} filename 
 * @returns {DatabaseSync}
 */
export function sqlite3_open(filename) {
	const db_option = {
		readOnly: true,
	};
	const regexp_option = {
		deterministic: true,
		directOnly: true,
	};
	const match_option = {
		deterministic: true,
		directOnly: true,
		useBigIntArguments: true,
	};
	const db = new DatabaseSync(filename, db_option);
	db.exec("PRAGMA trusted_schema = OFF;");
	db.function('regexp', regexp_option, regexp_test);
	db.function('match', match_option, setcode_match);
	return db;
}

/**
 * Merge databases in `db_list` into `base_db`.
 * @param {string} base_db
 * @param {string[]} db_list
 * @returns {DatabaseSync?}
 */
export function merge_db(base_db, db_list) {
	if (db_list.length === 0) {
		return null;
	}
	const base = new DatabaseSync(base_db);
	base.exec("PRAGMA trusted_schema = OFF;");
	const stmt1 = base.prepare(stmt_attach);
	for (const db of db_list) {
		try {
			stmt1.run(db);
			base.exec(stmt_merge);
			base.exec(stmt_detach);
		}
		catch (error) {
			console.error('Failed to merge database:', db);
			console.error(error);
			base.close();
			return null;
		}
	}
	return base;
}

const convert_table = new Map();
/**
 * Write int64 `setcode` to an array.
 * @param {number[]} list 
 * @param {bigint} setcode 
 */
function write_setcode(list, setcode) {
	list.length = 0;
	if (!setcode) {
		return;
	}
	if (convert_table.has(setcode)) {
		list.push(...convert_table.get(setcode));
		return;
	}
	const result = new Set();
	for (let i = 0n; i < 4n; i += 1n) {
		const section = (setcode >> (i * 16n)) & 0xffffn;
		if (section) {
			result.add(Number(section));
		}
	}
	convert_table.set(setcode, result);
	list.push(...result);
}

/**
 * Query cards from `db` with statement `qstr` and binding object `arg`.
 * @param {DatabaseSync} db 
 * @param {string} sql 
 * @param {object} arg 
 * @returns {Entry[]}
 */
export function query_db(db, sql = stmt_default, arg = arg_default) {
	let page_filter = '';
	if (Number.isSafeInteger(arg.$limit)) {
		page_filter = ` LIMIT $limit`;
		if (Number.isSafeInteger(arg.$offset)) {
			page_filter += ` OFFSET $offset`;
		}
	}
	const full_sql = `${sql} ORDER BY id${page_filter}`;
	const stmt = db.prepare(full_sql);
	stmt.setReadBigInts(true);
	const result = stmt.all(arg);
	for (const card of result) {
		for (const [column, value] of Object.entries(card)) {
			switch (column) {
				case 'level':
					card.level = Number(BigInt.asUintN(32, value) & 0xffffn);
					card.scale = Number((BigInt.asUintN(32, value) & 0xff000000n) >> 24n);
					break;
				case 'setcode':
				case 'race':
				case 'category':
					card[column] = BigInt.asIntN(64, value);
					break;
				default:
					if (typeof value === 'bigint')
						card[column] = Number(value);
					break;
			}
		}
		if (Object.hasOwn(card, 'setcode')) {
			const setcode = card.setcode;
			card.setcode = [];
			const list = extra_setcodes.get(card.id);
			if (list)
				card.setcode.push(...list);
			else
				write_setcode(card.setcode, setcode);
		}
	}
	return result;
}

/**
 * Check if the card is an alternative artwork card.
 * @param {Entry} cdata
 * @returns 
 */
export function is_alternative(cdata) {
	if (cdata.id === ID_BLACK_LUSTER_SOLDIER)
		return false;
	return Math.abs(cdata.id - cdata.alias) < CARD_ARTWORK_VERSIONS_OFFSET;
}

/**
 * The sqlite condition of setcode.
 * @param {number} setcode
 * @param {object} arg
 * @returns {string}
 */
export function setcode_condition(setcode, arg) {
	let condition = `setcode MATCH $setcode`;
	arg.$setcode = BigInt(setcode);
	const id_list = code_table.get(setcode);
	if (id_list) {
		condition += ` OR ${list_condition('id', 'sid', id_list, arg)}`;
	}
	return `(${condition})`;
}

/**
 * The sqlite condition for a list.
 * @param {string} column 
 * @param {string} prefix 
 * @param {number[]} list 
 * @param {object} arg 
 * @returns {string}
 */
export function list_condition(column, prefix, list, arg) {
	const set1 = new Set(list);
	const tokens = [];
	let index = 0;
	for (const value of set1) {
		if (!Number.isSafeInteger(value)) {
			continue;
		}
		tokens.push(`@${prefix}${index}`);
		arg[`@${prefix}${index}`] = value;
		index++;
	}
	return `${column} IN (${tokens.join(', ')})`;
}

/**
 * Convert a string to a LIKE pattern.
 * @param {string} str 
 * @returns {string}
 */
export function like_pattern(str) {
	if (!str)
		return '';
	if (re_wildcard.test(str))
		return str;
	return `%${str.replace(replace_dollar, '$$$&')}%`;
}

/**
 * Generate the name condition of a statement.
 * @param {string} input
 * @param {object} arg
 * @returns {string}
 */
export function name_condition(input, arg) {
	let condition = `name LIKE $name ESCAPE '$' OR "desc" LIKE $kanji ESCAPE '$' OR alias IN (${stmt_no_alias} AND name LIKE $name ESCAPE '$')`;
	arg.$name = like_pattern(input);
	arg.$kanji = `%※${like_pattern(input)}`;
	Object.assign(arg, arg_no_alias);
	let keyword = '';
	if (!re_wildcard.test(input))
		keyword = input.replace(replace_escape, '').toLowerCase();
	if (keyword && normalized_setname_table[keyword]) {
		condition += ` OR ${setcode_condition(normalized_setname_table[keyword], arg)}`;
	}
	return `(${condition})`;
}

// database tool
/**
 * Get cards from databases file at `path` with statement `sql` and binding object `arg`.
 * @param {string} path
 * @param {string} sql 
 * @param {object} arg 
 * @returns 
 */
export function read_db(path, sql = stmt_default, arg = arg_default) {
	const db = sqlite3_open(path);
	const ret = query_db(db, sql, arg);
	db.close();
	return ret;
}

/**
 * Check if the card name is unique in the database file.
 * @param {string} path 
 * @param {number} id_luster
 * @returns 
 */
export function check_uniqueness(path, id_luster = ID_BLACK_LUSTER_SOLDIER) {
	const condition = ` AND (NOT type & $token OR alias = $none) AND (type & $token OR id = $luster OR abs(id - alias) >= $artwork_offset)`;
	const stmt1 = `${select_name}${condition}`;
	const arg1 = {
		$token: arg_default.$token,
		$luster: id_luster,
		$artwork_offset: arg_default.$artwork_offset,
		$none: 0,
	};
	const cards = read_db(path, stmt1, arg1);
	if (cards.length === 0) {
		console.error('No cards found in the database:', path);
		return false;
	}
	const table1 = new Map();
	const postfix = 'N';
	for (const card of cards) {
		table1.set(card.id, card.name)
	}
	if (table1.has(id_luster))
		table1.set(id_luster, `${table1.get(id_luster)}${postfix}`);
	if (table1.has(ALT_POLYMERIZATION)) {
		console.log('alternative Polymerization');
		table1.delete(ALT_POLYMERIZATION);
	}
	if (table1.has(ALT_DARK_MAGICIAN)) {
		console.log('alternative Dark Magician');
		table1.delete(ALT_DARK_MAGICIAN);
	}
	console.log('total:', table1.size);
	const inv1 = inverse_mapping(table1);
	return inv1.size === table1.size;
}

/**
 * @param {number} id 
 * @returns {number}
 */
export function get_source_cid(id) {
	for (let i = id; i > id - CARD_ARTWORK_VERSIONS_OFFSET; i -= 1) {
		if (id_to_cid.has(i))
			return id_to_cid.get(i);
	}
	return 0;
}
