"use strict";
const initSqlJs = require('sql.js');

const cid_table = require('./data/cid.json');
const name_table = require('./data/name_table.json');
const name_table_en = require('./data/name_table_en.json');
const ltable = require('./data/lflist.json');
const ltable_md = require('./data/lflist_md.json');

const MAX_CHOICE = 20;

const const_type = {
	// type
	TYPE_MONSTER: 0x1,
	TYPE_SPELL: 0x2,
	TYPE_TRAP: 0x4,
	
	// color type
	TYPE_NORMAL: 0x10,
	TYPE_EFFECT: 0x20,
	TYPE_FUSION: 0x40,
	TYPE_RITUAL: 0x80,
	TYPE_SYNCHRO: 0x2000,
	TYPE_XYZ: 0x800000,
	TYPE_PENDULUM: 0x1000000,
	TYPE_LINK: 0x4000000,
	
	// extype
	TYPE_SPIRIT: 0x200,
	TYPE_UNION: 0x400,
	TYPE_DUAL: 0x800,
	TYPE_TUNER: 0x1000,
	TYPE_TOKEN: 0x4000,
	TYPE_FLIP: 0x200000,
	TYPE_TOON: 0x400000,
	TYPE_SPSUMMON: 0x2000000,
	
	// spell type
	TYPE_QUICKPLAY: 0x10000,
	TYPE_CONTINUOUS: 0x20000,
	TYPE_EQUIP: 0x40000,
	//TYPE_RITUAL
	TYPE_FIELD: 0x80000,
	
	// trap type
	//TYPE_CONTINUOUS
	TYPE_COUNTER: 0x100000,
};
const_type.TYPE_EXT = const_type.TYPE_FUSION | const_type.TYPE_SYNCHRO | const_type.TYPE_XYZ | const_type.TYPE_LINK;

const const_race = {
	RACE_WARRIOR: 0x1,
	RACE_SPELLCASTER: 0x2,
	RACE_FAIRY: 0x4,
	RACE_FIEND: 0x8,
	RACE_ZOMBIE: 0x10,
	RACE_MACHINE: 0x20,
	RACE_AQUA: 0x40,
	RACE_PYRO: 0x80,
	RACE_ROCK: 0x100,
	RACE_WINDBEAST: 0x200,
	RACE_PLANT: 0x400,
	RACE_INSECT: 0x800,
	RACE_THUNDER: 0x1000,
	RACE_DRAGON: 0x2000,
	RACE_BEAST: 0x4000,
	RACE_BEASTWARRIOR: 0x8000,
	RACE_DINOSAUR: 0x10000,
	RACE_FISH: 0x20000,
	RACE_SEASERPENT: 0x40000,
	RACE_REPTILE: 0x80000,
	RACE_PSYCHO: 0x100000,
	RACE_DIVINE: 0x200000,
	RACE_CREATORGOD: 0x400000,
	RACE_WYRM: 0x800000,
	RACE_CYBERSE: 0x1000000,
};

const const_attribute = {
	ATTRIBUTE_EARTH: 0x01,
	ATTRIBUTE_WATER: 0x02,
	ATTRIBUTE_FIRE: 0x04,
	ATTRIBUTE_WIND: 0x08,
	ATTRIBUTE_LIGHT: 0x10,
	ATTRIBUTE_DARK: 0x20,
	ATTRIBUTE_DIVINE: 0x40,
};

const const_marker = {
	LINK_MARKER_BOTTOM_LEFT: 0x001, // ↙
	LINK_MARKER_BOTTOM: 0x002, // ↓
	LINK_MARKER_BOTTOM_RIGHT: 0x004, // ↘

	LINK_MARKER_LEFT: 0x008, // ←
	LINK_MARKER_RIGHT: 0x020, // →

	LINK_MARKER_TOP_LEFT: 0x040, // ↖
	LINK_MARKER_TOP: 0x080, // ↑
	LINK_MARKER_TOP_RIGHT: 0x100, // ↗
};


const attr_to_str = {
	[const_attribute.ATTRIBUTE_EARTH]: '地',
	[const_attribute.ATTRIBUTE_WATER]: '水',
	[const_attribute.ATTRIBUTE_FIRE]: '炎',
	[const_attribute.ATTRIBUTE_WIND]: '風',
	[const_attribute.ATTRIBUTE_LIGHT]: '光',
	[const_attribute.ATTRIBUTE_DARK]: '闇',
	[const_attribute.ATTRIBUTE_DIVINE]: '神',
};

const race_to_str = {
	[const_race.RACE_WARRIOR]: '戰士',
	[const_race.RACE_SPELLCASTER]: '魔法使',
	[const_race.RACE_FAIRY]: '天使',
	[const_race.RACE_FIEND]: '惡魔',
	[const_race.RACE_ZOMBIE]: '不死',
	[const_race.RACE_MACHINE]: '機械',
	[const_race.RACE_AQUA]: '水',
	[const_race.RACE_PYRO]: '炎',
	[const_race.RACE_ROCK]: '岩石',
	[const_race.RACE_WINDBEAST]: '鳥獸',
	[const_race.RACE_PLANT]: '植物',
	[const_race.RACE_INSECT]: '昆蟲',
	[const_race.RACE_THUNDER]: '雷',
	[const_race.RACE_DRAGON]: '龍',
	[const_race.RACE_BEAST]: '獸',
	[const_race.RACE_BEASTWARRIOR]: '獸戰士',
	[const_race.RACE_DINOSAUR]: '恐龍',
	[const_race.RACE_FISH]: '魚',
	[const_race.RACE_SEASERPENT]: '海龍',
	[const_race.RACE_REPTILE]: '爬蟲類',
	[const_race.RACE_PSYCHO]: '超能',
	[const_race.RACE_DIVINE]: '幻神獸',
	[const_race.RACE_CREATORGOD]: '創造神',
	[const_race.RACE_WYRM]: '幻龍',
	[const_race.RACE_CYBERSE]: '電子界',
};

const base_url = "https://salix5.github.io";
const promise_db = fetch(`${base_url}/CardEditor/cards.cdb`).then(response => response.arrayBuffer()).then(buf => new Uint8Array(buf));
const promise_db2 = fetch(`${base_url}/cdb/pre-release.cdb`).then(response => response.arrayBuffer()).then(buf => new Uint8Array(buf));
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
		if (card.type & (const_type.TYPE_SPELL | const_type.TYPE_TRAP)) {
			card.atk = 0;
			card.def = 0;
			card.level = 0;
			card.race = 0;
			card.attribute = 0;
		}
		card.scale = (card.level >> 24) & 0xff;
		card.level = card.level & 0xff;

		// color
		if (card.type & const_type.TYPE_MONSTER) {
			if (!(card.type & const_type.TYPE_EXT)) {
				if (card.type & const_type.TYPE_TOKEN)
					card.color = 0;
				else if (card.type & const_type.TYPE_NORMAL)
					card.color = 1;
				else if (card.type & const_type.TYPE_RITUAL)
					card.color = 3;
				else if (card.type & const_type.TYPE_EFFECT)
					card.color = 2;
				else
					card.color = null;
			}
			else {
				if (card.type & const_type.TYPE_FUSION)
					card.color = 4;
				else if (card.type & const_type.TYPE_SYNCHRO)
					card.color = 5;
				else if (card.type & const_type.TYPE_XYZ)
					card.color = 6;
				else if (card.type & const_type.TYPE_LINK)
					card.color = 7;
				else
					card.color = null;
			}
		}
		else if (card.type & const_type.TYPE_SPELL) {
			if (card.type === const_type.TYPE_SPELL)
				card.color = 10;
			else if (card.type & const_type.TYPE_QUICKPLAY)
				card.color = 11;
			else if (card.type & const_type.TYPE_CONTINUOUS)
				card.color = 12;
			else if (card.type & const_type.TYPE_EQUIP)
				card.color = 13;
			else if (card.type & const_type.TYPE_RITUAL)
				card.color = 14;
			else if (card.type & const_type.TYPE_FIELD)
				card.color = 15;
			else
				card.color = null;
		}
		else if (card.type & const_type.TYPE_TRAP) {
			if (card.type === const_type.TYPE_TRAP)
				card.color = 20;
			else if (card.type & const_type.TYPE_CONTINUOUS)
				card.color = 21;
			else if (card.type & const_type.TYPE_COUNTER)
				card.color = 22;
			else
				card.color = null;
		}
		else {
			card.color = null;
		}

		card.cid = cid_table[card.id] ? cid_table[card.id] : null;
		card.jp_name = name_table[card.id] ? name_table[card.id] : null;
		card.en_name = name_table_en[card.id] ? name_table_en[card.id] : null;
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
	ready: promise_sql,

	const_type: const_type,
	const_race: const_attribute,
	const_attribute: const_attribute,
	const_marker: const_marker,

	default_query: `SELECT datas.id, ot, alias, type, atk, def, level, attribute, race, name, desc FROM datas, texts WHERE datas.id == texts.id AND abs(datas.id - alias) >= 10 AND NOT type & ${const_type.TYPE_TOKEN}`,

	is_alternative(card) {
		if (card.type & const_type.TYPE_TOKEN)
			return alias !== 0;
		else
			return Math.abs(card.id - card.alias) < 10;
	},

	query_card(qstr, arg, ret) {
		query_db(db1, qstr, arg, ret);
		query_db(db2, qstr, arg, ret);
	},

	query_id(id, ret) {
		let qstr = `${this.default_query} AND datas.id == ${id};`;
		let arg = new Object();
		query_db(db1, qstr, arg, ret);
		if (!ret.length)
			query_db(db2, qstr, arg, ret);
	},

	print_data(card) {
		let mtype = '';
		let subtype = '';
		let lvstr = `\u2605`;
		let lfstr = '';

		let official_name = '';
		let data = '';

		if (card.jp_name)
			official_name += `${card.jp_name}\n`;
		if (card.en_name && !(card.ot === 2 && card.en_name === card.jp_name))
			official_name += `${card.en_name}\n`;

		if (ltable[card.id] !== undefined || ltable_md[card.id] !== undefined) {
			let lfstr_o = '';
			let lfstr_m = '';
			switch (ltable[card.id]) {
				case 0:
					lfstr_o = 'OCG：禁止';
					break;
				case 1:
					lfstr_o = 'OCG：限制';
					break;
				case 2:
					lfstr_o = 'OCG：準限制';
					break;
				default:
					lfstr_o = 'OCG：無';
					break;
			}
			switch (ltable_md[card.id]) {
				case 0:
					lfstr_m = 'MD：禁止';
					break;
				case 1:
					lfstr_m = 'MD：限制';
					break;
				case 2:
					lfstr_m = 'MD：準限制';
					break;
				default:
					lfstr_m = 'MD：無';
					break;
			}
			lfstr = `(${lfstr_o} / ${lfstr_m})\n`;
		}

		if (card.type & const_type.TYPE_MONSTER) {
			mtype = '怪獸';
			if (card.type & const_type.TYPE_RITUAL)
				subtype = '/儀式';
			else if (card.type & const_type.TYPE_FUSION)
				subtype = '/融合';
			else if (card.type & const_type.TYPE_SYNCHRO)
				subtype = '/同步';
			else if (card.type & const_type.TYPE_XYZ) {
				subtype = '/超量';
				lvstr = `\u2606`;
			}
			else if (card.type & const_type.TYPE_LINK) {
				subtype = '/連結';
				lvstr = 'LINK-';
			}
			if (card.type & const_type.TYPE_PENDULUM) {
				subtype += '/靈擺';
			}

			// extype
			if (card.type & const_type.TYPE_NORMAL)
				subtype += '/通常';
			if (card.type & const_type.TYPE_SPIRIT)
				subtype += '/靈魂';
			if (card.type & const_type.TYPE_UNION)
				subtype += '/聯合';
			if (card.type & const_type.TYPE_DUAL)
				subtype += '/二重';
			if (card.type & const_type.TYPE_TUNER)
				subtype += '/協調';
			if (card.type & const_type.TYPE_FLIP)
				subtype += '/反轉';
			if (card.type & const_type.TYPE_TOON)
				subtype += '/卡通';
			if (card.type & const_type.TYPE_SPSUMMON)
				subtype += '/特殊召喚';
			if (card.type & const_type.TYPE_EFFECT)
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
			if (!(card.type & const_type.TYPE_LINK)) {
				data += `/守${print_ad(card.def)}`;
			}
			data += '\n';
			if (card.type & const_type.TYPE_PENDULUM) {
				data += `【靈擺刻度：${card.scale}】\n`;
			}
			if (card.type & const_type.TYPE_LINK) {
				let marker = '';
				if (card.def & LINK_MARKER_TOP_LEFT)
					marker += `:arrow_upper_left:`;
				else
					marker += `:black_large_square:`;

				if (card.def & LINK_MARKER_TOP)
					marker += `:arrow_up:`;
				else
					marker += `:black_large_square:`;

				if (card.def & LINK_MARKER_TOP_RIGHT)
					marker += `:arrow_upper_right:`;
				else
					marker += `:black_large_square:`;

				marker += '\n';

				if (card.def & LINK_MARKER_LEFT)
					marker += `:arrow_left:`;
				else
					marker += `:black_large_square:`;

				marker += `:black_large_square:`;

				if (card.def & LINK_MARKER_RIGHT)
					marker += `:arrow_right:`;
				else
					marker += `:black_large_square:`;

				marker += '\n';

				if (card.def & LINK_MARKER_BOTTOM_LEFT)
					marker += `:arrow_lower_left:`;
				else
					marker += `:black_large_square:`;

				if (card.def & LINK_MARKER_BOTTOM)
					marker += `:arrow_down:`;
				else
					marker += `:black_large_square:`;

				if (card.def & LINK_MARKER_BOTTOM_RIGHT)
					marker += `:arrow_lower_right:`;
				else
					marker += `:black_large_square:`;
				marker += '\n';
				data += marker;
			}
		}
		else if (card.type & const_type.TYPE_SPELL) {
			mtype = '魔法';
			if (card.type & const_type.TYPE_QUICKPLAY)
				subtype = '速攻';
			else if (card.type & const_type.TYPE_CONTINUOUS)
				subtype = '永續';
			else if (card.type & const_type.TYPE_EQUIP)
				subtype = '裝備';
			else if (card.type & const_type.TYPE_RITUAL)
				subtype = '儀式';
			else if (card.type & const_type.TYPE_FIELD)
				subtype = '場地';
			else
				subtype = '通常';
			data = `${lfstr}[${subtype}${mtype}]\n`;
		}
		else if (card.type & const_type.TYPE_TRAP) {
			mtype = '陷阱';
			if (card.type & const_type.TYPE_CONTINUOUS)
				subtype = '永續';
			else if (card.type & const_type.TYPE_COUNTER)
				subtype = '反擊';
			else
				subtype = '通常';
			data = `${lfstr}[${subtype}${mtype}]\n`;
		}
		let card_text = `**${card.name}**\n${official_name}${data}${card.desc}\n--`;
		return card_text;
	},

	filter_choice(choice_table, focused) {
		const keyword = focused.toLowerCase();
		const starts_with = [];
		const other = [];

		for (const choice of Object.keys(choice_table)) {
			if (choice.toLowerCase().includes(keyword)) {
				if (choice.toLowerCase().startsWith(keyword))
					starts_with.push(choice);
				else
					other.push(choice);
			}
		}
		const ret = starts_with.concat(other);
		if (ret.length > MAX_CHOICE)
			ret.length = MAX_CHOICE;
		return ret;
	},
};
