import extra_setcodes from './data/extra_setcodes.json' with { type: 'json' };
import { DatabaseSync } from "node:sqlite";
import { monster_types } from "./ygo-constant.mjs";
import { inverse_mapping } from "./ygo-utility.mjs";

export const ID_TYLER_THE_GREAT_WARRIOR = 68811206;
export const ID_BLACK_LUSTER_SOLDIER = 5405695;
export const ALT_POLYMERIZATION = 27847700;
export const ALT_DARK_MAGICIAN = 36996508;

export const CARD_ARTWORK_VERSIONS_OFFSET = 20;
export const MAX_CARD_ID = 99999999;

export const select_all = `SELECT datas.id, ot, alias, setcode, type, atk, def, level, attribute, race, name, "desc" FROM datas, texts WHERE datas.id == texts.id`;
export const select_name = `SELECT datas.id, name FROM datas, texts WHERE datas.id == texts.id`;
export const base_filter = ` AND datas.id != $tyler AND NOT type & $token`;
export const no_alt_filter = ` AND (datas.id == $luster OR abs(datas.id - alias) >= $artwork_offset)`;
export const stmt_default = `${select_all}${base_filter}${no_alt_filter}`;
export const arg_default = {
	$tyler: ID_TYLER_THE_GREAT_WARRIOR,
	$luster: ID_BLACK_LUSTER_SOLDIER,
	$artwork_offset: CARD_ARTWORK_VERSIONS_OFFSET,
	$token: monster_types.TYPE_TOKEN,
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
 * @param {DatabaseSync} db 
 * @param {string} sql 
 * @param {Object} arg 
 * @returns 
 */
export function query_db(db, sql = stmt_default, arg = arg_default) {
	const ret = [];
	const stmt = db.prepare(sql);
	stmt.setReadBigInts(true);
	const result = stmt.all(arg);
	for (const cdata of result) {
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
	return ret;
}

/**
 * Get cards from databases file at `path` with statement `qstr` and binding object `arg`.
 * @param {string} path
 * @param {string} sql 
 * @param {Object} arg 
 * @returns 
 */
export function read_db(path, sql = stmt_default, arg = arg_default) {
	const db = new DatabaseSync(path, { readOnly: true });
	if (!db) {
		console.error('Failed to open database:', path);
		return [];
	}
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
