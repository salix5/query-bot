"use strict";
const initSqlJs = require('sql.js');

const cid_table = require('./data/cid.json');
const name_table_jp = require('./data/name_table.json');
const name_table_kr = require('./data/name_table_kr.json');
const name_table_en = require('./data/name_table_en.json');
const md_name = require('./data/md_name.json');
const md_name_en = require('./data/md_name_en.json');
const ltable_ocg = require('./data/lflist.json');
const ltable_tcg = require('./data/lflist_tcg.json');
const ltable_md = require('./data/lflist_md.json');

const lang_tw = require('./lang/zh-tw.json');
const lang_ja = require('./lang/ja.json');
const lang_ko = require('./lang/ko.json');
const lang_en = require('./lang/en.json');

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

// special ID
const ID_TYLER_THE_GREAT_WARRIOR = 68811206;
const ID_BLACK_LUSTER_SOLDIER = 5405695;

const select_all = `SELECT datas.id, ot, alias, type, atk, def, level, attribute, race, name, desc FROM datas, texts WHERE datas.id == texts.id`;
const select_id = `SELECT datas.id FROM datas, texts WHERE datas.id == texts.id`;

const base_filter = ` AND datas.id != ${ID_TYLER_THE_GREAT_WARRIOR} AND NOT type & ${TYPE_TOKEN}`;
const physical_filter = `${base_filter} AND (datas.id == ${ID_BLACK_LUSTER_SOLDIER} OR abs(datas.id - alias) >= 10)`;
const effect_filter = ` AND (NOT type & ${TYPE_NORMAL} OR type & ${TYPE_PENDULUM})`;

const stmt_default = `${select_all}${physical_filter}`;
const stmt_no_alias = `${select_id}${base_filter} AND alias == 0`;


const lang = Object.create(null);
lang['zh-tw'] = lang_tw;
lang['ja'] = lang_ja;
lang['ko'] = lang_ko;
lang['en'] = lang_en;

const official_name = Object.create(null);
official_name['ja'] = 'jp_name';
official_name['ko'] = 'kr_name';
official_name['en'] = 'en_name';

const name_table = Object.create(null);
name_table['ja'] = name_table_jp;
name_table['ko'] = name_table_kr;
name_table['en'] = name_table_en;
name_table['md'] = md_name;

let SQL = null;
const db_list = [];

const domain = 'https://salix5.github.io';
const fetch_db = fetch(`${domain}/CardEditor/cards.cdb`)
	.then(response => response.arrayBuffer())
	.then(buf => new Uint8Array(buf));
const fetch_db2 = fetch(`${domain}/cdb/pre-release.cdb`)
	.then(response => response.arrayBuffer())
	.then(buf => new Uint8Array(buf));
const db_ready = Promise.all([initSqlJs(), fetch_db, fetch_db2])
	.then(([sql, file1, file2]) => {
		SQL = sql;
		db_list.push(new SQL.Database(file1));
		db_list.push(new SQL.Database(file2));
		return db_list;
	});


function is_alternative(card) {
	if (card.type & TYPE_TOKEN)
		return card.alias !== 0;
	else if (card.id === ID_BLACK_LUSTER_SOLDIER)
		return false;
	else
		return Math.abs(card.id - card.alias) < 10;
}

function is_released(card) {
	return !!(card.jp_name || card.en_name);
}


// query
function setcode_condition(setcode) {
	const setcode_str1 = `(setcode & 0xfff) == (${setcode} & 0xfff) AND (setcode & (${setcode} & 0xf000)) == (${setcode} & 0xf000)`;
	const setcode_str2 = `(setcode >> 16 & 0xfff) == (${setcode} & 0xfff) AND (setcode >> 16 & (${setcode} & 0xf000)) == (${setcode} & 0xf000)`;
	const setcode_str3 = `(setcode >> 32 & 0xfff) == (${setcode} & 0xfff) AND (setcode >> 32 & (${setcode} & 0xf000)) == (${setcode} & 0xf000)`;
	const setcode_str4 = `(setcode >> 48 & 0xfff) == (${setcode} & 0xfff) AND (setcode >> 48 & (${setcode} & 0xf000)) == (${setcode} & 0xf000)`;
	let ret = `(${setcode_str1} OR ${setcode_str2} OR ${setcode_str3} OR ${setcode_str4})`;
	return ret;
}

function query_db(db, qstr, arg, ret) {
	if (!db)
		return;

	let stmt = db.prepare(qstr);
	stmt.bind(arg);
	while (stmt.step()) {
		let cdata = stmt.getAsObject();
		let card = Object.create(null);

		// basic
		card.id = cdata.id;
		card.ot = cdata.ot;
		card.alias = cdata.alias;
		card.setcode = cdata.setcode;
		card.type = cdata.type;
		card.real_id = is_alternative(card) ? card.alias : card.id;

		// copy data
		if (card.type & (TYPE_SPELL | TYPE_TRAP)) {
			card.atk = 0;
			card.def = 0;
			card.level = 0;
			card.race = 0;
			card.attribute = 0;
		}
		else {
			card.atk = cdata.atk;
			card.def = cdata.def;
			card.race = cdata.race;
			card.attribute = cdata.attribute;
			if (card.type & TYPE_PENDULUM) {
				card.scale = (cdata.level >> 24) & 0xff;
				card.level = cdata.level & 0xff;
			}
			else {
				card.level = cdata.level;
			}
		}
		card.tw_name = cdata.name;
		card.desc = cdata.desc;

		// color
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
		if (typeof cid_table[card.real_id] === 'number') {
			card.cid = cid_table[card.real_id];
			if (name_table_jp[card.cid]) {
				if (card.ot === 2)
					card.md_nmae_jp = name_table_jp[card.cid];
				else
					card.jp_name = name_table_jp[card.cid];
			}
			if (name_table_kr[card.cid])
				card.kr_name = name_table_kr[card.cid];

			if (name_table_en[card.cid])
				card.en_name = name_table_en[card.cid];
			else if (md_name_en[card.cid])
				card.md_name_en = md_name_en[card.cid];

			if (md_name[card.cid])
				card.md_name = md_name[card.cid];
		}
		ret.push(card);
	}
	stmt.free();
}

function query(qstr, arg, ret) {
	ret.length = 0;
	for (const db of db_list) {
		query_db(db, qstr, arg, ret);
	}
}

function query_alias(alias, ret) {
	let qstr = `${stmt_default} AND alias == $alias;`;
	let arg = new Object();
	arg.$alias = alias;
	ret.length = 0;
	for (const db of db_list) {
		query_db(db, qstr, arg, ret);
	}
}

function get_card(id) {
	let qstr = `SELECT datas.id, ot, alias, type, atk, def, level, attribute, race, name, desc FROM datas, texts WHERE datas.id == $id AND datas.id == texts.id;`;
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


// locale
function get_name(id, locale) {
	const cid = cid_table[id];
	if (name_table[locale])
		return name_table[locale][cid];
	else
		return null;
}

function get_request_locale(card, locale) {
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


// output
function print_ad(x) {
	if (x === -2)
		return '?';
	else
		return x;
}

function print_data(card, newline, locale) {
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

function print_card(card, locale) {
	let lfstr = '';
	let lfstr_main = '';
	let lfstr_md = '';
	let seperator = '';

	let strings = lang[locale];
	let card_name = 'null';
	let other_name = '';
	let desc = '';
	let ltable = null;

	switch (locale) {
		case 'zh-tw':
			card_name = card.tw_name;

			if (card.jp_name)
				other_name += `${card.jp_name}\n`;
			else if (card.md_nmae_jp)
				other_name += `${card.md_nmae_jp}    (MD)\n`;
			if (card.en_name)
				other_name += `${card.en_name}\n`;
			else if (card.md_name_en)
				other_name += `${card.md_name_en}    (MD)\n`;

			if (card.md_name)
				other_name += `MD：${card.md_name}\n`;
			desc = `${card.desc}\n--`;
			ltable = ltable_ocg;
			break;
		case 'ja':
			if (card.jp_name)
				card_name = card.jp_name;
			else if (card.md_nmae_jp)
				card_name = `${card.md_nmae_jp}    (MD)`;

			if (card.en_name)
				other_name = `${card.en_name}\n`;
			else if (card.md_name_en)
				other_name = `${card.md_name_en}    (MD)\n`;
			if (card.md_name)
				other_name += `MD：:white_check_mark:\n`;
			if (card.db_desc)
				desc = card.db_desc;
			ltable = ltable_ocg;
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
			ltable = ltable_ocg;
			break;
		case 'en':
			if (card.en_name)
				card_name = card.en_name;
			else if (card.md_name_en)
				card_name = `${card.md_name_en}    (MD)`;

			if (card.jp_name)
				other_name = `${card.jp_name}\n`;
			else if (card.md_nmae_jp)
				other_name = `${card.md_nmae_jp}    (MD)\n`;
			if (card.md_name)
				other_name += `MD：:white_check_mark:\n`;
			if (card.db_desc)
				desc = card.db_desc;
			ltable = ltable_tcg;
			break;
		default:
			break;
	}

	if (ltable[card.real_id] !== undefined)
		lfstr_main = `${strings.limit_name['region']}：${strings.limit_name[ltable[card.real_id]]}`;
	if (ltable_md[card.real_id] !== undefined) {
		lfstr_md = `MD：${strings.limit_name[ltable_md[card.real_id]]}`;
	}
	if (lfstr_main && lfstr_md)
		seperator = ' / ';
	if (lfstr_main || lfstr_md)
		lfstr = `(${lfstr_main}${seperator}${lfstr_md})\n`;

	let card_text = `**${card_name}**\n${other_name}${lfstr}${print_data(card, '\n', locale)}${desc}\n`;
	return card_text;
}

function print_db_link(cid, request_locale) {
	return `https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=${cid}&request_locale=${request_locale}`;
}

function print_wiki_link(id) {
	return `https://yugipedia.com/wiki/${id}`;
}

function print_qa_link(cid) {
	return `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=${cid}&request_locale=ja`;
}


module.exports = {
	db_ready,

	ID_BLACK_LUSTER_SOLDIER,
	ID_TYLER_THE_GREAT_WARRIOR,

	type: {
		TYPE_MONSTER,
		TYPE_SPELL,
		TYPE_TRAP,
	},

	monster_type: {
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
	},

	spell_type: {
		TYPE_QUICKPLAY,
		TYPE_CONTINUOUS,
		TYPE_EQUIP,
		TYPE_RITUAL,
		TYPE_FIELD,
	},

	trap_type: {
		TYPE_CONTINUOUS,
		TYPE_COUNTER,
	},

	race: {
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
	},

	attribute: {
		ATTRIBUTE_EARTH,
		ATTRIBUTE_WATER,
		ATTRIBUTE_FIRE,
		ATTRIBUTE_WIND,
		ATTRIBUTE_LIGHT,
		ATTRIBUTE_DARK,
		ATTRIBUTE_DIVINE,
	},

	link_marker: {
		LINK_MARKER_BOTTOM_LEFT,
		LINK_MARKER_BOTTOM,
		LINK_MARKER_BOTTOM_RIGHT,

		LINK_MARKER_LEFT,
		LINK_MARKER_RIGHT,

		LINK_MARKER_TOP_LEFT,
		LINK_MARKER_TOP,
		LINK_MARKER_TOP_RIGHT,
	},

	select_all,
	select_id,

	base_filter,
	physical_filter,
	effect_filter,

	stmt_default,
	stmt_no_alias,

	cid_table,
	name_table,

	is_alternative,
	is_released,

	setcode_condition,
	query,
	query_alias,
	get_card,

	get_name,
	get_request_locale,

	print_data,
	print_card,
	print_db_link,
	print_wiki_link,
	print_qa_link,
};
