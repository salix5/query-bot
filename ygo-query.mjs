import initSqlJs from 'sql.js';
import cid_table from './data/cid.json' assert { type: 'json' };
import ltable_ocg from './data/lflist.json' assert { type: 'json' };
import ltable_tcg from './data/lflist_tcg.json' assert { type: 'json' };
import ltable_md from './data/lflist_md.json' assert { type: 'json' };

import name_table_en from './data/name_table_en.json' assert { type: 'json' };
import name_table_jp from './data/name_table.json' assert { type: 'json' };
import name_table_kr from './data/name_table_kr.json' assert { type: 'json' };
import md_name from './data/md_name.json' assert { type: 'json' };
import md_name_en from './data/md_name_en.json' assert { type: 'json' };
import md_name_jp from './data/md_name_jp.json' assert { type: 'json' };

import lang_en from './lang/en.json' assert { type: 'json' };
import lang_ja from './lang/ja.json' assert { type: 'json' };
import lang_ko from './lang/ko.json' assert { type: 'json' };
import lang_zhtw from './lang/zh-tw.json' assert { type: 'json' };

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

const select_all = `SELECT datas.id, ot, alias, setcode, type, atk, def, level, attribute, race, name, desc FROM datas, texts WHERE datas.id == texts.id`;
const select_id = `SELECT datas.id FROM datas, texts WHERE datas.id == texts.id`;

const base_filter = ` AND datas.id != ${ID_TYLER_THE_GREAT_WARRIOR} AND NOT type & ${TYPE_TOKEN}`;
const physical_filter = `${base_filter} AND (datas.id == ${ID_BLACK_LUSTER_SOLDIER} OR abs(datas.id - alias) >= 10)`;
const effect_filter = ` AND (NOT type & ${TYPE_NORMAL} OR type & ${TYPE_PENDULUM})`;

const stmt_default = `${select_all}${physical_filter}`;
const stmt_no_alias = `${select_id}${base_filter} AND alias == 0`;

export {
	ID_TYLER_THE_GREAT_WARRIOR, ID_BLACK_LUSTER_SOLDIER, CID_BLACK_LUSTER_SOLDIER,
	select_all, select_id, base_filter, physical_filter, effect_filter, stmt_default, stmt_no_alias
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

const name_table = Object.create(null);
name_table['en'] = name_table_en;
name_table['ja'] = name_table_jp;
name_table['ko'] = name_table_kr;
name_table['md'] = md_name;

const md_table = Object.create(null);
md_table['en'] = md_name_en;
md_table['ja'] = md_name_jp;

const cid_inverse = inverse_mapping(cid_table);

// id -> option name
const option_table = Object.create(null);
option_table['en'] = create_options('en');
option_table['ja'] = create_options('ja');
option_table['ko'] = create_options('ko');

export { lang, official_name, cid_table, name_table, md_table, cid_inverse, option_table };

const domain = 'https://salix5.github.io/cdb';
const fetch_db = fetch(`${domain}/cards.cdb`).then(response => response.arrayBuffer());
const fetch_db2 = fetch(`${domain}/expansions/pre-release.cdb`).then(response => response.arrayBuffer());
const [SQL, buf1, buf2] = await Promise.all([initSqlJs(), fetch_db, fetch_db2]);
const db_list = [];
db_list.push(new SQL.Database(new Uint8Array(buf1)));
db_list.push(new SQL.Database(new Uint8Array(buf2)));

/**
 * @typedef {Object} Card
 * @property {number} id
 * @property {number} ot
 * @property {number} alias
 * @property {number[]} setcode
 * @property {number} real_id - The id of real card
 * 
 * @property {number} type
 * @property {number} color - Card color for sorting
 * @property {number} atk
 * @property {number} def
 * @property {number} level
 * @property {number} scale
 * @property {number} race
 * @property {number} attribute
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
		setcode = setcode >> 16n;
	}
}

/**
 * Check if `card.setode` contains `value`.
 * @param {Card} card 
 * @param {number} value 
 * @returns
 */
function is_setcode(card, value) {
	const settype = value & 0x0fff;
	const setsubtype = value & 0xf000;
	for (const x of card.setcode) {
		if ((x & 0x0fff) === settype && (x & 0xf000 & setsubtype) === setsubtype)
			return true;
	}
	return false;
}

/**
 * Query cards from `db` using statement `qstr` and binding object `arg`, and put the results in `ret`.
 * scale = level >> 24
 * @param {initSqlJs.Database} db 
 * @param {string} qstr 
 * @param {Object} arg 
 * @param {Card[]} ret  
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
							for (const x of extra_setcode[card.id]) {
								card.setcode.push(x);
							}
						}
						else {
							set_setcode(card, value);
						}
					}
					break;
				case 'type':
					card[column] = Number(value);
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
					break;
				case 'level':
					card.level = Number(value) & 0xff;
					card.scale = (Number(value) >>> 24) & 0xff;
					break;
				case 'name':
					card.tw_name = value;
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
		if ('real_id' in card && typeof cid_table[card.real_id] === 'number') {
			card.cid = cid_table[card.real_id];
		}
		if ('cid' in card && 'tw_name' in card) {
			if (name_table_jp[card.cid])
				card.jp_name = name_table_jp[card.cid];
			else if (md_name_jp[card.cid])
				card.md_name_jp = md_name_jp[card.cid];

			if (name_table_en[card.cid])
				card.en_name = name_table_en[card.cid];
			else if (md_name_en[card.cid])
				card.md_name_en = md_name_en[card.cid];

			if (name_table_kr && name_table_kr[card.cid])
				card.kr_name = name_table_kr[card.cid];

			if (md_name[card.cid])
				card.md_name = md_name[card.cid];
		}
		ret.push(card);
	}
	stmt.free();
}

function create_options(request_locale) {
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
			return Object.create(null);
	}
	const options = Object.create(null);
	for (const [cid, name] of Object.entries(name_table[request_locale])) {
		if (!cid_inverse[cid]) {
			console.error(`unknown cid:`, cid);
			continue;
		}
		if (cid == CID_BLACK_LUSTER_SOLDIER)
			options[cid_inverse[cid]] = `${name}${postfix}`;
		else
			options[cid_inverse[cid]] = name;
	}
	if (md_table[request_locale]) {
		for (const [cid, name] of Object.entries(md_table[request_locale])) {
			if (!cid_inverse[cid]) {
				console.error(`unknown cid:`, cid);
				continue;
			}
			if (options[cid_inverse[cid]]) {
				console.error(`duplicate cid: md_table[${request_locale}]`, cid);
				continue;
			}
			options[cid_inverse[cid]] = name;
		}
	}
	return options;
}

// export
/**
 * Create the inverse mapping of `obj`.
 * @param {Object} table 
 * @returns {Object}
 */
export function inverse_mapping(table) {
	const inverse = Object.create(null);
	for (const [key, value] of Object.entries(table)) {
		if (inverse[value]) {
			console.error('non-invertible', `${key}: ${value}`);
			return Object.create(null);
		}
		inverse[value] = parseInt(key);
	}
	return inverse;
}

/**
 * Create the option to id table of region `request_locale`
 * @param {string} request_locale 
 * @returns {Object}
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
			return Object.create(null);
	}
	const inverse = inverse_mapping(option_table[request_locale]);
	const collator = new Intl.Collator(locale);
	return Object.assign(Object.create(null), Object.fromEntries(Object.entries(inverse).sort((a, b) => collator.compare(a[0], b[0]))));
}

/**
 * Create the name to id table for cards not released in Japan.
 * @returns {Object}
 */
export function create_choice_prerelease() {
	const inverse_table = Object.create(null);
	const pre_list = [];
	const search_pre = `SELECT datas.id, name, desc FROM datas, texts WHERE datas.id == texts.id AND (ot == 2 OR datas.id > 99999999)${physical_filter}`;
	const re_kanji = /※.*/;
	query(search_pre, {}, pre_list);
	for (const card of pre_list) {
		if (name_table_jp[cid_table[card.id]] || md_name_jp[cid_table[card.id]]) {
			continue;
		}
		let res = re_kanji.exec(card.desc);
		let kanji = res ? res[0] : '';
		if (inverse_table[card.tw_name] || (kanji && inverse_table[kanji])) {
			console.error('choice_prerelease', card.id);
			return Object.create(null);
		}
		inverse_table[card.tw_name] = card.id;
		if (kanji)
			inverse_table[kanji] = card.id;
	}
	const collator = Intl.Collator('zh-Hant');
	return Object.fromEntries(Object.entries(inverse_table).sort((a, b) => collator.compare(a[0], b[0])));
}

/**
 * is_alternative() - Check if the card is an alternative artwork card.
 * @param {Card} card
 * @returns 
 */
export function is_alternative(card) {
	if (card.id === ID_BLACK_LUSTER_SOLDIER)
		return false;
	else
		return Math.abs(card.id - card.alias) < 10;
}

/**
 * is_released() - Check if the card has an official card name.
 * @param {Card} card
 * @returns
 */
export function is_released(card) {
	return !!(card.jp_name || card.en_name);
}

/**
 * The sqlite condition of checking setcode.
 * @param {string} setcode 
 * @returns {string}
 */
export function setcode_condition(setcode) {
	const setcode_str1 = `(setcode & 0xfff) == (${setcode} & 0xfff) AND (setcode & (${setcode} & 0xf000)) == (${setcode} & 0xf000)`;
	const setcode_str2 = `(setcode >> 16 & 0xfff) == (${setcode} & 0xfff) AND (setcode >> 16 & (${setcode} & 0xf000)) == (${setcode} & 0xf000)`;
	const setcode_str3 = `(setcode >> 32 & 0xfff) == (${setcode} & 0xfff) AND (setcode >> 32 & (${setcode} & 0xf000)) == (${setcode} & 0xf000)`;
	const setcode_str4 = `(setcode >> 48 & 0xfff) == (${setcode} & 0xfff) AND (setcode >> 48 & (${setcode} & 0xf000)) == (${setcode} & 0xf000)`;
	let ret = `(${setcode_str1} OR ${setcode_str2} OR ${setcode_str3} OR ${setcode_str4})`;
	return ret;
}

/**
 * Query card from all databases using statement `qstr` and binding object `arg`.
 * The results are put in `ret`.
 * @param {string} qstr 
 * @param {Object} arg 
 * @param {Card[]} ret 
 */
export function query(qstr, arg, ret) {
	ret.length = 0;
	for (const db of db_list) {
		query_db(db, qstr, arg, ret);
	}
}

/**
 * Query card from all databases with `alias`.
 * The results are put in `ret`.
 * @param {number} alias 
 * @param {Card[]} ret 
 */
export function query_alias(alias, ret) {
	let qstr = `${stmt_default} AND alias == $alias;`;
	let arg = new Object();
	arg.$alias = alias;
	ret.length = 0;
	for (const db of db_list) {
		query_db(db, qstr, arg, ret);
	}
}

/**
 * Get a card with `id` from all databases.
 * @param {number} id 
 * @returns {Card}
 */
export function get_card(id) {
	let qstr = `${select_all} AND datas.id == $id;`;
	let arg = new Object();
	arg.$id = id;
	let ret = [];
	for (const db of db_list) {
		query_db(db, qstr, arg, ret);
		if (ret.length)
			return ret[0];
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
	const cid = cid_table[id];
	if (name_table[locale] && name_table[locale][cid])
		return name_table[locale][cid];
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

		let lv = card.level;
		data += `${lvstr}${lv == 0 ? '?' : lv}`;
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

	let card_text = `**${card_name}**\n${other_name}${lfstr}${print_data(card, '\n', locale)}${desc}\n`;
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
