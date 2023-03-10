"use strict";
const initSqlJs = require('sql.js');
const cid_table = require('./data/cid.json');
const name_table = require('./data/name_table.json');
const name_table_en = require('./data/name_table_en.json');
const ltable = require('./data/lflist.json');
const ltable_md = require('./data/lflist_md.json');

const MAX_CHOICE = 20;

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

// attr
const ATTRIBUTE_EARTH = 0x01;
const ATTRIBUTE_WATER = 0x02;
const ATTRIBUTE_FIRE = 0x04;
const ATTRIBUTE_WIND = 0x08;
const ATTRIBUTE_LIGHT = 0x10;
const ATTRIBUTE_DARK = 0x20;
const ATTRIBUTE_DIVINE = 0x40;

// Link Marker
const LINK_MARKER_BOTTOM_LEFT = 0x001;	// ???
const LINK_MARKER_BOTTOM = 0x002;		// ???
const LINK_MARKER_BOTTOM_RIGHT = 0x004;	// ???

const LINK_MARKER_LEFT = 0x008;			// ???
const LINK_MARKER_RIGHT = 0x020;		// ???

const LINK_MARKER_TOP_LEFT = 0x040;		// ???
const LINK_MARKER_TOP = 0x080;			// ???
const LINK_MARKER_TOP_RIGHT = 0x100;	// ???

const attr_to_str = {
	[ATTRIBUTE_EARTH]: '???',
	[ATTRIBUTE_WATER]: '???',
	[ATTRIBUTE_FIRE]: '???',
	[ATTRIBUTE_WIND]: '???',
	[ATTRIBUTE_LIGHT]: '???',
	[ATTRIBUTE_DARK]: '???',
	[ATTRIBUTE_DIVINE]: '???'
};

const race_to_str = {
	[RACE_WARRIOR]: '??????',
	[RACE_SPELLCASTER]: '?????????',
	[RACE_FAIRY]: '??????',
	[RACE_FIEND]: '??????',
	[RACE_ZOMBIE]: '??????',
	[RACE_MACHINE]: '??????',
	[RACE_AQUA]: '???',
	[RACE_PYRO]: '???',
	[RACE_ROCK]: '??????',
	[RACE_WINDBEAST]: '??????',
	[RACE_PLANT]: '??????',
	[RACE_INSECT]: '??????',
	[RACE_THUNDER]: '???',
	[RACE_DRAGON]: '???',
	[RACE_BEAST]: '???',
	[RACE_BEASTWARRIOR]: '?????????',
	[RACE_DINOSAUR]: '??????',
	[RACE_FISH]: '???',
	[RACE_SEASERPENT]: '??????',
	[RACE_REPTILE]: '?????????',
	[RACE_PSYCHO]: '??????',
	[RACE_DIVINE]: '?????????',
	[RACE_CREATORGOD]: '?????????',
	[RACE_WYRM]: '??????',
	[RACE_CYBERSE]: '?????????'
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

	default_query1: `SELECT datas.id, ot, alias, type, atk, def, level, attribute, race, name, desc FROM datas, texts WHERE datas.id == texts.id AND abs(datas.id - alias) >= 10 AND NOT type & ${TYPE_TOKEN}`,
	default_query2: `SELECT datas.id FROM datas, texts WHERE datas.id == texts.id AND alias == 0 AND NOT type & ${TYPE_TOKEN}`,

	is_alternative(card) {
		if (card.type & TYPE_TOKEN)
			return card.alias !== 0;
		else
			return Math.abs(card.id - card.alias) < 10;
	},

	query_card(qstr, arg, ret) {
		ret.length = 0;
		query_db(db1, qstr, arg, ret);
		query_db(db2, qstr, arg, ret);
	},

	query_id(id, ret) {
		let qstr = `${this.default_query1} AND datas.id == $id;`;
		let arg = new Object();
		arg.$id = id;
		ret.length = 0;
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
					lfstr_o = 'OCG?????????';
					break;
				case 1:
					lfstr_o = 'OCG?????????';
					break;
				case 2:
					lfstr_o = 'OCG????????????';
					break;
				default:
					lfstr_o = 'OCG??????';
					break;
			}
			switch (ltable_md[card.id]) {
				case 0:
					lfstr_m = 'MD?????????';
					break;
				case 1:
					lfstr_m = 'MD?????????';
					break;
				case 2:
					lfstr_m = 'MD????????????';
					break;
				default:
					lfstr_m = 'MD??????';
					break;
			}
			lfstr = `(${lfstr_o} / ${lfstr_m})\n`;
		}

		if (card.type & TYPE_MONSTER) {
			mtype = '??????';
			if (card.type & TYPE_RITUAL)
				subtype = '/??????';
			else if (card.type & TYPE_FUSION)
				subtype = '/??????';
			else if (card.type & TYPE_SYNCHRO)
				subtype = '/??????';
			else if (card.type & TYPE_XYZ) {
				subtype = '/??????';
				lvstr = `\u2606`;
			}
			else if (card.type & TYPE_LINK) {
				subtype = '/??????';
				lvstr = 'LINK-';
			}
			if (card.type & TYPE_PENDULUM) {
				subtype += '/??????';
			}

			// extype
			if (card.type & TYPE_NORMAL)
				subtype += '/??????';
			if (card.type & TYPE_SPIRIT)
				subtype += '/??????';
			if (card.type & TYPE_UNION)
				subtype += '/??????';
			if (card.type & TYPE_DUAL)
				subtype += '/??????';
			if (card.type & TYPE_TUNER)
				subtype += '/??????';
			if (card.type & TYPE_FLIP)
				subtype += '/??????';
			if (card.type & TYPE_TOON)
				subtype += '/??????';
			if (card.type & TYPE_SPSUMMON)
				subtype += '/????????????';
			if (card.type & TYPE_EFFECT)
				subtype += '/??????';
			data = `${lfstr}[${mtype}${subtype}]\n`;

			let lv = card.level;
			data += `${lvstr}${lv == 0 ? "?" : lv}`;
			if (card.attribute)
				data += `/${attr_to_str[card.attribute]}`;
			else
				data += '/???';
			if (card.race)
				data += `/${race_to_str[card.race]}???`;
			else
				data += '/??????';
			data += `/???${print_ad(card.atk)}`;
			if (!(card.type & TYPE_LINK)) {
				data += `/???${print_ad(card.def)}`;
			}
			data += '\n';
			if (card.type & TYPE_PENDULUM) {
				data += `??????????????????${card.scale}???\n`;
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
			mtype = '??????';
			if (card.type & TYPE_QUICKPLAY)
				subtype = '??????';
			else if (card.type & TYPE_CONTINUOUS)
				subtype = '??????';
			else if (card.type & TYPE_EQUIP)
				subtype = '??????';
			else if (card.type & TYPE_RITUAL)
				subtype = '??????';
			else if (card.type & TYPE_FIELD)
				subtype = '??????';
			else
				subtype = '??????';
			data = `${lfstr}[${subtype}${mtype}]\n`;
		}
		else if (card.type & TYPE_TRAP) {
			mtype = '??????';
			if (card.type & TYPE_CONTINUOUS)
				subtype = '??????';
			else if (card.type & TYPE_COUNTER)
				subtype = '??????';
			else
				subtype = '??????';
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
