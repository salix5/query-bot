import extra_setcodes from './data/extra_setcodes.json' with { type: 'json' };
import { DatabaseSync } from "node:sqlite";
import { ALT_DARK_MAGICIAN, ALT_POLYMERIZATION, ID_BLACK_LUSTER_SOLDIER, ID_TYLER_THE_GREAT_WARRIOR, monster_types } from "./ygo-constant.mjs";
import { inverse_mapping } from "./ygo-utility.mjs";
import { id_to_cid } from './ygo-json-loader.mjs';

export {
	ALT_DARK_MAGICIAN,
	ALT_POLYMERIZATION,
	CID_BLACK_LUSTER_SOLDIER,
	ID_BLACK_LUSTER_SOLDIER,
	ID_TYLER_THE_GREAT_WARRIOR,
	monster_types,
	spell_types,
	trap_types,
	races,
	attributes,
	link_markers,
} from './ygo-constant.mjs';

export const CARD_ARTWORK_VERSIONS_OFFSET = 20;
export const MAX_CARD_ID = 99999999;

export const select_all = `SELECT datas.id, ot, alias, setcode, type, atk, def, level, attribute, race, name, "desc" FROM datas, texts WHERE datas.id == texts.id`;
export const select_id = `SELECT datas.id FROM datas, texts WHERE datas.id == texts.id`;
export const select_name = `SELECT datas.id, name FROM datas, texts WHERE datas.id == texts.id`;

export const base_filter = ` AND datas.id != $tyler AND NOT type & $token`;
export const no_alt_filter = ` AND (datas.id == $luster OR abs(datas.id - alias) >= $artwork_offset)`;
export const default_filter = `${base_filter}${no_alt_filter}`;
export const effect_filter = ` AND (NOT type & $normal OR type & $pendulum)`;

export const stmt_default = `${select_all}${default_filter}`;
export const arg_default = {
	$tyler: ID_TYLER_THE_GREAT_WARRIOR,
	$luster: ID_BLACK_LUSTER_SOLDIER,
	$artwork_offset: CARD_ARTWORK_VERSIONS_OFFSET,
	$token: monster_types.TYPE_TOKEN,
};

export const stmt_base = `${select_all}${base_filter}`;
export const arg_base = {
	$tyler: ID_TYLER_THE_GREAT_WARRIOR,
	$token: monster_types.TYPE_TOKEN,
};

export const stmt_no_alias = `${select_id}${base_filter} AND alias == $none`;
export const arg_no_alias = {
	$tyler: ID_TYLER_THE_GREAT_WARRIOR,
	$token: monster_types.TYPE_TOKEN,
	$none: 0,
};

const over_hundred = '(name like $101 OR name like $102 OR name like $103 OR name like $104 OR name like $105 OR name like $106 OR name like $107)';
export const stmt_seventh = `${stmt_default} AND type & $xyz AND ${over_hundred}`;
export const arg_seventh = {
	...arg_default,
	$xyz: monster_types.TYPE_XYZ,
};
for (let i = 0; i < 7; ++i) {
	arg_seventh[`$${101 + i}`] = `%No.${101 + i}%`;
}

export const escape_table = {
	'%': '$%',
	'_': '$_',
	'$': '$$',
};

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

export function regexp_test(pattern, x) {
	const re = new RegExp(pattern);
	return re.test(x) ? 1 : 0;
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
	const funtion_option = {
		deterministic: true,
		directOnly: true,
	};
	const db = new DatabaseSync(filename, db_option);
	db.exec("PRAGMA trusted_schema = OFF;");
	db.function('regexp', funtion_option, regexp_test);
	return db;
}

/**
 * Set `card.setcode` from int64.
 * @param {Entry} card 
 * @param {bigint} setcode 
 */
function set_setcode(card, setcode) {
	setcode = BigInt.asUintN(64, setcode);
	card.setcode.length = 0;
	while (setcode) {
		if (setcode & 0xffffn) {
			card.setcode.push(Number(setcode & 0xffffn));
		}
		setcode = setcode >> 16n;
	}
}

/**
 * Query cards from `db` with statement `qstr` and binding object `arg`.
 * @param {DatabaseSync} db 
 * @param {string} sql 
 * @param {Object} arg 
 * @returns {Entry[]}
 */
export function query_db(db, sql = stmt_default, arg = arg_default) {
	const ret = [];
	const stmt = db.prepare(sql);
	stmt.setReadBigInts(true);
	const result = stmt.all(arg);
	for (const card of result) {
		for (const [column, value] of Object.entries(card)) {
			switch (column) {
				case 'setcode':
					card.setcode = [];
					if (value) {
						if (extra_setcodes[card.id]) {
							card.setcode.push(...extra_setcodes[card.id]);
						}
						else {
							set_setcode(card, value);
						}
					}
					break;
				case 'level':
					card.level = Number(value) & 0xffff;
					card.scale = Number(value) >> 24 & 0xff;
					break;
				default:
					if (typeof value === 'bigint')
						card[column] = Number(value);
					break;
			}
		}
		ret.push(card);
	}
	return ret;
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


// database tool
/**
 * Get cards from databases file at `path` with statement `sql` and binding object `arg`.
 * @param {string} path
 * @param {string} sql 
 * @param {Object} arg 
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
	const condition = ` AND (NOT type & $token OR alias == $none) AND (type & $token OR datas.id == $luster OR abs(datas.id - alias) >= $artwork_offset)`;
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
	for (let i = id; i > id - CARD_ARTWORK_VERSIONS_OFFSET; --i) {
		if (id_to_cid.has(i))
			return id_to_cid.get(i);
	}
	return 0;
}
