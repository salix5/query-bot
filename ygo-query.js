"use strict";
const initSqlJs = require('sql.js');
const cid_table = require('./data/cid.json');
const name_table = require('./data/name_table.json');
const name_table_en = require('./data/name_table_en.json');
const md_name = require('./data/md_name.json');
const md_name_en = require('./data/md_name_en.json');
const ltable = require('./data/lflist.json');
const ltable_md = require('./data/lflist_md.json');

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
const ID_BLACK_LUSTER_SOLDIER = 5405695;

const attribute_name = {
	unknown: '？',
	[ATTRIBUTE_EARTH]: '地',
	[ATTRIBUTE_WATER]: '水',
	[ATTRIBUTE_FIRE]: '炎',
	[ATTRIBUTE_WIND]: '風',
	[ATTRIBUTE_LIGHT]: '光',
	[ATTRIBUTE_DARK]: '闇',
	[ATTRIBUTE_DIVINE]: '神',
};

const race_name = {
	unknown: '？族',
	[RACE_WARRIOR]: '戰士族',
	[RACE_SPELLCASTER]: '魔法使族',
	[RACE_FAIRY]: '天使族',
	[RACE_FIEND]: '惡魔族',
	[RACE_ZOMBIE]: '不死族',
	[RACE_MACHINE]: '機械族',
	[RACE_AQUA]: '水族',
	[RACE_PYRO]: '炎族',
	[RACE_ROCK]: '岩石族',
	[RACE_WINDBEAST]: '鳥獸族',
	[RACE_PLANT]: '植物族',
	[RACE_INSECT]: '昆蟲族',
	[RACE_THUNDER]: '雷族',
	[RACE_DRAGON]: '龍族',
	[RACE_BEAST]: '獸族',
	[RACE_BEASTWARRIOR]: '獸戰士族',
	[RACE_DINOSAUR]: '恐龍族',
	[RACE_FISH]: '魚族',
	[RACE_SEASERPENT]: '海龍族',
	[RACE_REPTILE]: '爬蟲類族',
	[RACE_PSYCHO]: '超能族',
	[RACE_DIVINE]: '幻神獸族',
	[RACE_CREATORGOD]: '創造神族',
	[RACE_WYRM]: '幻龍族',
	[RACE_CYBERSE]: '電子界族',
	[RACE_ILLUSION]: '幻想魔族',
};

const type_name = {
	[TYPE_MONSTER]: '怪獸',
	[TYPE_SPELL]: '魔法',
	[TYPE_TRAP]: '陷阱',

	[TYPE_NORMAL]: '通常',
	[TYPE_EFFECT]: '效果',
	[TYPE_FUSION]: '融合',
	[TYPE_RITUAL]: '儀式',
	[TYPE_SYNCHRO]: '同步',
	[TYPE_XYZ]: '超量',
	[TYPE_PENDULUM]: '靈擺',
	[TYPE_LINK]: '連結',

	[TYPE_SPIRIT]: '靈魂',
	[TYPE_UNION]: '聯合',
	[TYPE_DUAL]: '二重',
	[TYPE_TUNER]: '協調',
	[TYPE_TOKEN]: '衍生物',
	[TYPE_FLIP]: '反轉',
	[TYPE_TOON]: '卡通',
	[TYPE_SPSUMMON]: '特殊召喚',

	[TYPE_QUICKPLAY]: '速攻',
	[TYPE_CONTINUOUS]: '永續',
	[TYPE_EQUIP]: '裝備',
	[TYPE_FIELD]: '場地',
	[TYPE_COUNTER]: '反擊',
}

const value_name = {
	atk: '攻',
	def: '守',
	scale: '靈擺刻度',
}

const limit_name = {
	0: '禁止',
	1: '限制',
	2: '準限制',
}

const marker_char = {
	[LINK_MARKER_BOTTOM_LEFT]: ':arrow_lower_left:',
	[LINK_MARKER_BOTTOM]: ':arrow_down:',
	[LINK_MARKER_BOTTOM_RIGHT]: ':arrow_lower_right:',

	[LINK_MARKER_LEFT]: ':arrow_left:',
	[LINK_MARKER_RIGHT]: ':arrow_right:',

	[LINK_MARKER_TOP_LEFT]: ':arrow_upper_left:',
	[LINK_MARKER_TOP]: ':arrow_up:',
	[LINK_MARKER_TOP_RIGHT]: ':arrow_upper_right:',

	default: ':black_large_square:',
};

let SQL = null;
const db_list = [];
const domain = 'https://salix5.github.io';

const db_ready = Promise.all([
	initSqlJs(),
	fetch(`${domain}/CardEditor/cards.cdb`).then(response => response.arrayBuffer()).then(buf => new Uint8Array(buf)),
	fetch(`${domain}/cdb/pre-release.cdb`).then(response => response.arrayBuffer()).then(buf => new Uint8Array(buf)),
]).then(([sql, file1, file2]) => {
	SQL = sql;
	db_list.push(new SQL.Database(file1));
	db_list.push(new SQL.Database(file2));
});

function is_released(card) {
	return !!(card.jp_name || card.en_name);
}

function is_alternative(card) {
	if (card.type & TYPE_TOKEN)
		return card.alias !== 0;
	else if (card.id === ID_BLACK_LUSTER_SOLDIER)
		return false;
	else
		return Math.abs(card.id - card.alias) < 10;
}

function query_db(db, qstr, arg, ret) {
	if (!db)
		return;

	let stmt = db.prepare(qstr);
	stmt.bind(arg);
	while (stmt.step()) {
		let card = stmt.getAsObject();

		// real_id
		card.real_id = is_alternative(card) ? card.alias : card.id;

		// reset & change data
		if (card.type & (TYPE_SPELL | TYPE_TRAP)) {
			card.atk = 0;
			card.def = 0;
			card.level = 0;
			card.race = 0;
			card.attribute = 0;
		}
		else if (card.type & TYPE_PENDULUM) {
			card.scale = (card.level >> 24) & 0xff;
			card.level = card.level & 0xff;
		}

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
		if (typeof cid_table[card.real_id] === 'number')
			card.cid = cid_table[card.real_id];
		if (name_table[card.real_id])
			card.jp_name = name_table[card.real_id];

		if (name_table_en[card.real_id])
			card.en_name = name_table_en[card.real_id];
		else if (md_name_en[card.real_id])
			card.md_name_en = md_name_en[card.real_id];

		if (md_name[card.real_id])
			card.md_name = md_name[card.real_id];
		ret.push(card);
	}
	stmt.free();
}

function print_ad(x) {
	if (x === -2)
		return '?';
	else
		return x;
}

module.exports = {
	db_ready: db_ready,

	ID_BLACK_LUSTER_SOLDIER: ID_BLACK_LUSTER_SOLDIER,

	stmt_default: `SELECT datas.id, ot, alias, type, atk, def, level, attribute, race, name, desc FROM datas, texts`
		+ ` WHERE datas.id == texts.id AND NOT type & ${TYPE_TOKEN} AND (datas.id == ${ID_BLACK_LUSTER_SOLDIER} OR abs(datas.id - alias) >= 10)`,

	stmt_no_alternative: `SELECT datas.id, ot, alias, type, atk, def, level, attribute, race, name, desc FROM datas, texts`
		+ ` WHERE datas.id == texts.id AND NOT type & ${TYPE_TOKEN} AND abs(datas.id - alias) >= 10`,

	stmt_no_alias: `SELECT datas.id FROM datas, texts WHERE datas.id == texts.id AND NOT type & ${TYPE_TOKEN} AND alias == 0`,

	effect_filter: ` AND (NOT type & ${TYPE_NORMAL} OR type & ${TYPE_PENDULUM})`,

	is_alternative: is_alternative,

	setcode_condition(setcode) {
		const setcode_str1 = `(setcode & 0xfff) == (${setcode} & 0xfff) AND (setcode & (${setcode} & 0xf000)) == (${setcode} & 0xf000)`;
		const setcode_str2 = `(setcode >> 16 & 0xfff) == (${setcode} & 0xfff) AND (setcode >> 16 & (${setcode} & 0xf000)) == (${setcode} & 0xf000)`;
		const setcode_str3 = `(setcode >> 32 & 0xfff) == (${setcode} & 0xfff) AND (setcode >> 32 & (${setcode} & 0xf000)) == (${setcode} & 0xf000)`;
		const setcode_str4 = `(setcode >> 48 & 0xfff) == (${setcode} & 0xfff) AND (setcode >> 48 & (${setcode} & 0xf000)) == (${setcode} & 0xf000)`;
		let ret = `(${setcode_str1} OR ${setcode_str2} OR ${setcode_str3} OR ${setcode_str4})`;
		return ret;
	},

	query(qstr, arg, ret) {
		ret.length = 0;
		for (const db of db_list) {
			query_db(db, qstr, arg, ret);
		}
	},

	query_alias(alias, ret) {
		let qstr = `${this.stmt_no_alternative} AND alias == $alias;`;
		let arg = new Object();
		arg.$alias = alias;
		ret.length = 0;
		for (const db of db_list) {
			query_db(db, qstr, arg, ret);
		}
	},

	get_card(id) {
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
	},

	print_card(card) {
		let mtype = '';
		let subtype = '';
		let lvstr = '\u2605';
		let lfstr = '';
		let lfstr_o = '';
		let lfstr_m = '';
		let seperator = '';

		let official_name = '';
		let data = '';

		if (card.jp_name)
			official_name += `${card.jp_name}\n`;

		if (card.en_name)
			official_name += `${card.en_name}\n`;
		else if (card.md_name_en)
			official_name += `${card.md_name_en}    (MD)\n`;

		if (card.md_name)
			official_name += `MD：${card.md_name}\n`;

		if (ltable[card.real_id] !== undefined)
			lfstr_o = `OCG：${limit_name[ltable[card.real_id]]}`;
		if (ltable_md[card.real_id] !== undefined) {
			lfstr_m = `MD：${limit_name[ltable[card.real_id]]}`;
		}
		if (lfstr_o && lfstr_m)
			seperator = ' / ';
		if (lfstr_o || lfstr_m)
			lfstr = `(${lfstr_o}${seperator}${lfstr_m})\n`;

		if (card.type & TYPE_MONSTER) {
			mtype = type_name[TYPE_MONSTER];
			if (card.type & TYPE_RITUAL)
				subtype = `/${type_name[TYPE_RITUAL]}`;
			else if (card.type & TYPE_FUSION)
				subtype = `/${type_name[TYPE_FUSION]}`;
			else if (card.type & TYPE_SYNCHRO)
				subtype = `/${type_name[TYPE_SYNCHRO]}`;
			else if (card.type & TYPE_XYZ) {
				subtype = `/${type_name[TYPE_XYZ]}`;
				lvstr = `\u2606`;
			}
			else if (card.type & TYPE_LINK) {
				subtype = `/${type_name[TYPE_LINK]}`;
				lvstr = `LINK-`;
			}
			if (card.type & TYPE_PENDULUM) {
				subtype += `/${type_name[TYPE_PENDULUM]}`;
			}

			// extype
			if (card.type & TYPE_NORMAL)
				subtype += `/${type_name[TYPE_NORMAL]}`;
			if (card.type & TYPE_SPIRIT)
				subtype += `/${type_name[TYPE_SPIRIT]}`;
			if (card.type & TYPE_UNION)
				subtype += `/${type_name[TYPE_UNION]}`;
			if (card.type & TYPE_DUAL)
				subtype += `/${type_name[TYPE_DUAL]}`;
			if (card.type & TYPE_TUNER)
				subtype += `/${type_name[TYPE_TUNER]}`;
			if (card.type & TYPE_FLIP)
				subtype += `/${type_name[TYPE_FLIP]}`;
			if (card.type & TYPE_TOON)
				subtype += `/${type_name[TYPE_TOON]}`;
			if (card.type & TYPE_SPSUMMON)
				subtype += `/${type_name[TYPE_SPSUMMON]}`;
			if (card.type & TYPE_EFFECT)
				subtype += `/${type_name[TYPE_EFFECT]}`;
			data = `${lfstr}[${mtype}${subtype}]\n`;

			let lv = card.level;
			data += `${lvstr}${lv == 0 ? '?' : lv}`;
			if (card.attribute)
				data += `/${attribute_name[card.attribute]}`;
			else
				data += `/${attribute_name['unknown']}`;
			if (card.race)
				data += `/${race_name[card.race]}`;
			else
				data += `/${race_name['unknown']}`;
			data += `/${value_name['atk']}${print_ad(card.atk)}`;
			if (!(card.type & TYPE_LINK)) {
				data += `/${value_name['def']}${print_ad(card.def)}`;
			}
			data += '\n';
			if (card.type & TYPE_PENDULUM) {
				data += `【${value_name['scale']}：${card.scale}】\n`;
			}
			if (card.type & TYPE_LINK) {
				let marker_text = '';
				for (let marker = LINK_MARKER_TOP_LEFT; marker <= LINK_MARKER_TOP_RIGHT; marker <<= 1) {
					if (card.def & marker)
						marker_text += marker_char[marker];
					else
						marker_text += marker_char['default'];
				}
				marker_text += '\n';

				if (card.def & LINK_MARKER_LEFT)
					marker_text += marker_char[LINK_MARKER_LEFT];
				else
					marker_text += marker_char['default'];

				marker_text += marker_char['default'];

				if (card.def & LINK_MARKER_RIGHT)
					marker_text += marker_char[LINK_MARKER_RIGHT];
				else
					marker_text += marker_char['default'];

				marker_text += '\n';

				for (let marker = LINK_MARKER_BOTTOM_LEFT; marker <= LINK_MARKER_BOTTOM_RIGHT; marker <<= 1) {
					if (card.def & marker)
						marker_text += marker_char[marker];
					else
						marker_text += marker_char['default'];
				}
				marker_text += '\n';
				data += marker_text;
			}
		}
		else if (card.type & TYPE_SPELL) {
			mtype = `${type_name[TYPE_SPELL]}`;
			if (card.type & TYPE_QUICKPLAY)
				subtype = `${type_name[TYPE_QUICKPLAY]}`;
			else if (card.type & TYPE_CONTINUOUS)
				subtype = `${type_name[TYPE_CONTINUOUS]}`;
			else if (card.type & TYPE_EQUIP)
				subtype = `${type_name[TYPE_EQUIP]}`;
			else if (card.type & TYPE_RITUAL)
				subtype = `${type_name[TYPE_RITUAL]}`;
			else if (card.type & TYPE_FIELD)
				subtype = `${type_name[TYPE_FIELD]}`;
			else
				subtype = `${type_name[TYPE_NORMAL]}`;
			data = `${lfstr}[${subtype}${mtype}]\n`;
		}
		else if (card.type & TYPE_TRAP) {
			mtype = `${type_name[TYPE_TRAP]}`;
			if (card.type & TYPE_CONTINUOUS)
				subtype = `${type_name[TYPE_CONTINUOUS]}`;
			else if (card.type & TYPE_COUNTER)
				subtype = `${type_name[TYPE_COUNTER]}`;
			else
				subtype = `${type_name[TYPE_NORMAL]}`;
			data = `${lfstr}[${subtype}${mtype}]\n`;
		}
		let card_text = `**${card.name}**\n${official_name}${data}${card.desc}\n--`;
		return card_text;
	},

	print_db_link(cid, ot) {
		let locale = '';
		if (ot === 2)
			locale = 'en';
		else
			locale = 'ja';
		return `https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=${cid}&request_locale=${locale}`;
	},

	print_wiki_link(id) {
		return `https://yugipedia.com/wiki/${id}`;
	},

	print_qa_link(cid) {
		return `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=${cid}&request_locale=ja`;
	},
};
