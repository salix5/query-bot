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
const TYPE_EXT = TYPE_FUSION | TYPE_SYNCHRO | TYPE_XYZ | TYPE_LINK;

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
const TYPE_FIELD = 0x80000

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

// attr
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

const attr_to_str = {
	[ATTRIBUTE_EARTH]: '地',
	[ATTRIBUTE_WATER]: '水',
	[ATTRIBUTE_FIRE]: '炎',
	[ATTRIBUTE_WIND]: '風',
	[ATTRIBUTE_LIGHT]: '光',
	[ATTRIBUTE_DARK]: '闇',
	[ATTRIBUTE_DIVINE]: '神',
};

const race_to_str = {
	[RACE_WARRIOR]: '戰士',
	[RACE_SPELLCASTER]: '魔法使',
	[RACE_FAIRY]: '天使',
	[RACE_FIEND]: '惡魔',
	[RACE_ZOMBIE]: '不死',
	[RACE_MACHINE]: '機械',
	[RACE_AQUA]: '水',
	[RACE_PYRO]: '炎',
	[RACE_ROCK]: '岩石',
	[RACE_WINDBEAST]: '鳥獸',
	[RACE_PLANT]: '植物',
	[RACE_INSECT]: '昆蟲',
	[RACE_THUNDER]: '雷',
	[RACE_DRAGON]: '龍',
	[RACE_BEAST]: '獸',
	[RACE_BEASTWARRIOR]: '獸戰士',
	[RACE_DINOSAUR]: '恐龍',
	[RACE_FISH]: '魚',
	[RACE_SEASERPENT]: '海龍',
	[RACE_REPTILE]: '爬蟲類',
	[RACE_PSYCHO]: '超能',
	[RACE_DIVINE]: '幻神獸',
	[RACE_CREATORGOD]: '創造神',
	[RACE_WYRM]: '幻龍',
	[RACE_CYBERSE]: '電子界',
	[RACE_ILLUSION]: '幻想魔',
};

const marker_to_str = {
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

const domain = "https://salix5.github.io";
const promise_db = fetch(`${domain}/CardEditor/cards.cdb`).then(response => response.arrayBuffer()).then(buf => new Uint8Array(buf));
const promise_db2 = fetch(`${domain}/cdb/pre-release.cdb`).then(response => response.arrayBuffer()).then(buf => new Uint8Array(buf));
var db1 = null, db2 = null;

const promise_sql = Promise.all([initSqlJs(), promise_db, promise_db2,]).then(values => {
	let SQL = values[0];
	db1 = new SQL.Database(values[1]);
	db2 = new SQL.Database(values[2]);
});

function query_db(db, qstr, arg, ret) {
	if (!db)
		return;

	let stmt = db.prepare(qstr);
	stmt.bind(arg);
	while (stmt.step()) {
		let card = stmt.getAsObject();

		// spell & trap reset data
		if (card.type & (TYPE_SPELL | TYPE_TRAP)) {
			card.atk = 0;
			card.def = 0;
			card.level = 0;
			card.race = 0;
			card.attribute = 0;
		}
		card.scale = (card.level >> 24) & 0xff;
		card.level = card.level & 0xff;

		// color
		if (card.type & TYPE_MONSTER) {
			if (!(card.type & TYPE_EXT)) {
				if (card.type & TYPE_TOKEN)
					card.color = 0;
				else if (card.type & TYPE_NORMAL)
					card.color = 1;
				else if (card.type & TYPE_RITUAL)
					card.color = 3;
				else if (card.type & TYPE_EFFECT)
					card.color = 2;
				else
					card.color = null;
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
					card.color = null;
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
				card.color = null;
		}
		else if (card.type & TYPE_TRAP) {
			if (card.type === TYPE_TRAP)
				card.color = 20;
			else if (card.type & TYPE_CONTINUOUS)
				card.color = 21;
			else if (card.type & TYPE_COUNTER)
				card.color = 22;
			else
				card.color = null;
		}
		else {
			card.color = null;
		}
		if (typeof cid_table[card.id] === "number")
			card.cid = cid_table[card.id];
		if (name_table[card.id])
			card.jp_name = name_table[card.id];
		if (name_table_en[card.id])
			card.en_name = name_table_en[card.id];
		else if (md_name_en[card.id])
			card.md_name_en = md_name_en[card.id];
		if (md_name[card.id])
			card.md_name = md_name[card.id];
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

function print_limit(limit) {
	switch (limit) {
		case 0:
			return '禁止';
		case 1:
			return '限制';
		case 2:
			return '準限制';
		default:
			return '';
	}
}

function is_released(card) {
	return !!(card.jp_name || card.en_name);
}

module.exports = {
	db_ready: promise_sql,
	default_query1: `SELECT datas.id, ot, alias, type, atk, def, level, attribute, race, name, desc FROM datas, texts WHERE datas.id == texts.id AND abs(datas.id - alias) >= 10 AND NOT type & ${TYPE_TOKEN}`,
	default_query2: `SELECT datas.id FROM datas, texts WHERE datas.id == texts.id AND alias == 0 AND NOT type & ${TYPE_TOKEN}`,

	query(qstr, arg, ret) {
		ret.length = 0;
		query_db(db1, qstr, arg, ret);
		query_db(db2, qstr, arg, ret);
	},

	query_id(id, ret) {
		let qstr = `SELECT datas.id, ot, alias, type, atk, def, level, attribute, race, name, desc FROM datas, texts WHERE datas.id == $id AND datas.id == texts.id;`;
		let arg = new Object();
		arg.$id = id;
		ret.length = 0;
		query_db(db1, qstr, arg, ret);
		if (!ret.length)
			query_db(db2, qstr, arg, ret);
	},

	query_alias(alias, ret) {
		let qstr = `${this.default_query1} AND alias == $alias;`;
		let arg = new Object();
		arg.$alias = alias;
		ret.length = 0;
		query_db(db1, qstr, arg, ret);
		query_db(db2, qstr, arg, ret);
	},

	print_data(card) {
		let mtype = '';
		let subtype = '';
		let lvstr = `\u2605`;
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

		if (ltable[card.id] !== undefined)
			lfstr_o = `OCG：${print_limit(ltable[card.id])}`;
		if (ltable_md[card.id] !== undefined || (is_released(card) && !card.md_name)) {
			if (ltable_md[card.id] !== undefined) {
				lfstr_m = `MD：${print_limit(ltable_md[card.id])}`;
			}
			else {
				lfstr_m = 'MD：未收錄';
			}
		}
		if (lfstr_o && lfstr_m)
			seperator = ' / ';
		if (lfstr_o || lfstr_m)
			lfstr = `(${lfstr_o}${seperator}${lfstr_m})\n`;

		if (card.type & TYPE_MONSTER) {
			mtype = '怪獸';
			if (card.type & TYPE_RITUAL)
				subtype = '/儀式';
			else if (card.type & TYPE_FUSION)
				subtype = '/融合';
			else if (card.type & TYPE_SYNCHRO)
				subtype = '/同步';
			else if (card.type & TYPE_XYZ) {
				subtype = '/超量';
				lvstr = `\u2606`;
			}
			else if (card.type & TYPE_LINK) {
				subtype = '/連結';
				lvstr = 'LINK-';
			}
			if (card.type & TYPE_PENDULUM) {
				subtype += '/靈擺';
			}

			// extype
			if (card.type & TYPE_NORMAL)
				subtype += '/通常';
			if (card.type & TYPE_SPIRIT)
				subtype += '/靈魂';
			if (card.type & TYPE_UNION)
				subtype += '/聯合';
			if (card.type & TYPE_DUAL)
				subtype += '/二重';
			if (card.type & TYPE_TUNER)
				subtype += '/協調';
			if (card.type & TYPE_FLIP)
				subtype += '/反轉';
			if (card.type & TYPE_TOON)
				subtype += '/卡通';
			if (card.type & TYPE_SPSUMMON)
				subtype += '/特殊召喚';
			if (card.type & TYPE_EFFECT)
				subtype += '/效果';
			data = `${lfstr}[${mtype}${subtype}]\n`;

			let lv = card.level;
			data += `${lvstr}${lv == 0 ? "?" : lv}`;
			if (card.attribute)
				data += `/${attr_to_str[card.attribute]}`;
			else
				data += '/？';
			if (card.race)
				data += `/${race_to_str[card.race]}族`;
			else
				data += '/？族';
			data += `/攻${print_ad(card.atk)}`;
			if (!(card.type & TYPE_LINK)) {
				data += `/守${print_ad(card.def)}`;
			}
			data += '\n';
			if (card.type & TYPE_PENDULUM) {
				data += `【靈擺刻度：${card.scale}】\n`;
			}
			if (card.type & TYPE_LINK) {
				let marker_text = '';
				for (let marker = LINK_MARKER_TOP_LEFT; marker <= LINK_MARKER_TOP_RIGHT; marker <<= 1) {
					if (card.def & marker)
						marker_text += marker_to_str[marker];
					else
						marker_text += marker_to_str.default;
				}
				marker_text += '\n';

				if (card.def & LINK_MARKER_LEFT)
					marker_text += marker_to_str[LINK_MARKER_LEFT];
				else
					marker_text += marker_to_str.default;

				marker_text += marker_to_str.default;

				if (card.def & LINK_MARKER_RIGHT)
					marker_text += marker_to_str[LINK_MARKER_RIGHT];
				else
					marker_text += marker_to_str.default;

				marker_text += '\n';

				for (let marker = LINK_MARKER_BOTTOM_LEFT; marker <= LINK_MARKER_BOTTOM_RIGHT; marker <<= 1) {
					if (card.def & marker)
						marker_text += marker_to_str[marker];
					else
						marker_text += marker_to_str.default;
				}
				marker_text += '\n';
				data += marker_text;
			}
		}
		else if (card.type & TYPE_SPELL) {
			mtype = '魔法';
			if (card.type & TYPE_QUICKPLAY)
				subtype = '速攻';
			else if (card.type & TYPE_CONTINUOUS)
				subtype = '永續';
			else if (card.type & TYPE_EQUIP)
				subtype = '裝備';
			else if (card.type & TYPE_RITUAL)
				subtype = '儀式';
			else if (card.type & TYPE_FIELD)
				subtype = '場地';
			else
				subtype = '通常';
			data = `${lfstr}[${subtype}${mtype}]\n`;
		}
		else if (card.type & TYPE_TRAP) {
			mtype = '陷阱';
			if (card.type & TYPE_CONTINUOUS)
				subtype = '永續';
			else if (card.type & TYPE_COUNTER)
				subtype = '反擊';
			else
				subtype = '通常';
			data = `${lfstr}[${subtype}${mtype}]\n`;
		}
		let card_text = `**${card.name}**\n${official_name}${data}${card.desc}\n--`;
		return card_text;
	},

	is_alternative(card) {
		if (card.type & TYPE_TOKEN)
			return card.alias !== 0;
		else
			return Math.abs(card.id - card.alias) < 10;
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
