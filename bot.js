"use strict";
const cid_table = require('./data/cid.json');
const name_table = require('./data/name_table.json');
const name_table_en = require('./data/name_table_en.json');
const setname = require('./data/setname.json');
const ltable = require('./data/lflist.json');
const ltable_md = require('./data/lflist_md.json');

const fs = require('node:fs');
const path = require('node:path');
const initSqlJs = require('sql.js');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const { token } = require('./config.json');

// type
const TYPE_MONSTER		=0x1
const TYPE_SPELL		=0x2
const TYPE_TRAP			=0x4

// color type
const TYPE_NORMAL			=0x10
const TYPE_EFFECT			=0x20
const TYPE_FUSION			=0x40
const TYPE_RITUAL			=0x80
const TYPE_SYNCHRO		=0x2000
const TYPE_XYZ			=0x800000
const TYPE_PENDULUM		=0x1000000
const TYPE_LINK			=0x4000000
const TYPE_EXT = TYPE_FUSION | TYPE_SYNCHRO | TYPE_XYZ | TYPE_LINK

// extype
const TYPE_SPIRIT		=0x200
const TYPE_UNION		=0x400
const TYPE_DUAL			=0x800
const TYPE_TUNER		=0x1000
const TYPE_TOKEN		=0x4000
const TYPE_FLIP			=0x200000
const TYPE_TOON			=0x400000
const TYPE_SPSUMMON		=0x2000000

// spell type
const TYPE_QUICKPLAY		=0x10000
const TYPE_CONTINUOUS		=0x20000
const TYPE_EQUIP			=0x40000
//const TYPE_RITUAL			=0x80
const TYPE_FIELD			=0x80000

// trap type
//const TYPE_CONTINUOUS		=0x20000
const TYPE_COUNTER		=0x100000

// race
const RACE_WARRIOR		=0x1
const RACE_SPELLCASTER	=0x2
const RACE_FAIRY		=0x4
const RACE_FIEND		=0x8
const RACE_ZOMBIE		=0x10
const RACE_MACHINE		=0x20
const RACE_AQUA			=0x40
const RACE_PYRO			=0x80
const RACE_ROCK			=0x100
const RACE_WINDBEAST	=0x200
const RACE_PLANT		=0x400
const RACE_INSECT		=0x800
const RACE_THUNDER		=0x1000
const RACE_DRAGON		=0x2000
const RACE_BEAST		=0x4000
const RACE_BEASTWARRIOR	=0x8000
const RACE_DINOSAUR		=0x10000
const RACE_FISH			=0x20000
const RACE_SEASERPENT	=0x40000
const RACE_REPTILE		=0x80000
const RACE_PSYCHO		=0x100000
const RACE_DIVINE		=0x200000
const RACE_CREATORGOD	=0x400000
const RACE_WYRM			=0x800000
const RACE_CYBERSE		=0x1000000

// attr
const ATTRIBUTE_EARTH	=0x01
const ATTRIBUTE_WATER	=0x02
const ATTRIBUTE_FIRE	=0x04
const ATTRIBUTE_WIND	=0x08
const ATTRIBUTE_LIGHT	=0x10
const ATTRIBUTE_DARK	=0x20
const ATTRIBUTE_DIVINE	=0x40

// Link Marker
const LINK_MARKER_BOTTOM_LEFT	=0x001; // ↙
const LINK_MARKER_BOTTOM		=0x002; // ↓
const LINK_MARKER_BOTTOM_RIGHT = 0x004; // ↘

const LINK_MARKER_LEFT			=0x008; // ←
const LINK_MARKER_RIGHT			=0x020; // →

const LINK_MARKER_TOP_LEFT		=0x040; // ↖
const LINK_MARKER_TOP			=0x080; // ↑
const LINK_MARKER_TOP_RIGHT		=0x100; // ↗

const attr_to_str = {
	[ATTRIBUTE_EARTH]: '地',
	[ATTRIBUTE_WATER]: '水',
	[ATTRIBUTE_FIRE]: '炎',
	[ATTRIBUTE_WIND]: '風',
	[ATTRIBUTE_LIGHT]: '光',
	[ATTRIBUTE_DARK]: '闇',
	[ATTRIBUTE_DIVINE]: '神'
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
	[RACE_CYBERSE]: '電子界'
};

const MAX_RESULT_LEN = 200;

const REPLY_LENGTH = 5;
const LIST_LENGTH = 20;
const INPUT_LIMIT = 50;
const re_wildcard = /(^|[^\$])[%_]/;

var name = '';

String.prototype.toHalfWidth = function () {
	return this.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (s) { return String.fromCharCode(s.charCodeAt(0) - 0xFEE0) });
};

String.prototype.toFullWidth = function () {
	return this.replace(/[A-Za-z0-9]/g, function (s) { return String.fromCharCode(s.charCodeAt(0) + 0xFEE0); });
};

function string_to_literal(str) {
	return re_wildcard.test(str) ? str : `%${str}%`;
}

function setcode_cmd(setcode) {
	const setcode_str1 = `(setcode & 0xfff) == (${setcode} & 0xfff) AND (setcode & (${setcode} & 0xf000)) == (${setcode} & 0xf000)`;
	const setcode_str2 = `(setcode >> 16 & 0xfff) == (${setcode} & 0xfff) AND (setcode >> 16 & (${setcode} & 0xf000)) == (${setcode} & 0xf000)`;
	const setcode_str3 = `(setcode >> 32 & 0xfff) == (${setcode} & 0xfff) AND (setcode >> 32 & (${setcode} & 0xf000)) == (${setcode} & 0xf000)`;
	const setcode_str4 = `(setcode >> 48 & 0xfff) == (${setcode} & 0xfff) AND (setcode >> 48 & (${setcode} & 0xf000)) == (${setcode} & 0xf000)`;
	let ret = `(${setcode_str1} OR ${setcode_str2} OR ${setcode_str3} OR ${setcode_str4})`;
	return ret;
}

// return: name_cmd
// en: table, ja: table, zh: query
function process_name(locale, str_name, arg) {
	if (!str_name)
		return "";
	const setcode_str = ` OR ${setcode_cmd("$setcode")}`;
	let name_cmd = "";
	switch (locale) {
		case "en":
			// not implemented
			break;
		default:
			// ja, name
			let jp_list = [];
			let str_jp = str_name.toHalfWidth().toLowerCase();
			for (const [key, value] of Object.entries(name_table)) {
				if (value.toHalfWidth().toLowerCase().includes(str_jp))
					jp_list.push(key);
				if (jp_list.length > MAX_RESULT_LEN) {
					jp_list.length = 0;
					break;
				}
			}
			name_cmd = "0";
			for (let i = 0; i < jp_list.length; ++i)
				name_cmd += ` OR datas.id=${jp_list[i]}`;
			// zh, setcode
			if (!re_wildcard.test(str_name)) {
				let real_str = str_name.replace(/\$%/g, '%').replace(/\$_/g, '_').toLowerCase();
				for (const [key, value] of Object.entries(setname)) {
					if (key.toLowerCase() === real_str) {
						name_cmd += setcode_str;
						arg.$setcode = value;
						break;
					}
				}
			}
			// zh, name
			name_cmd += " OR name LIKE $name ESCAPE '$' OR desc LIKE $kanji ESCAPE '$'";
			name_cmd += " OR alias IN (SELECT datas.id FROM datas, texts WHERE datas.id == texts.id AND alias == 0 AND NOT type & $token AND name LIKE $name ESCAPE '$')";
			arg.$name = string_to_literal(str_name);
			arg.$kanji = `%※${string_to_literal(str_name)}`;
			break;
	}
	return name_cmd;
}

function is_alternative(id, alias, type) {
	if (type & TYPE_TOKEN)
		return alias !== 0;
	else
		return Math.abs(id - alias) < 10;
}

function query_card(db, qstr, arg, ret) {
	let stmt = db.prepare(qstr);
	stmt.bind(arg);

	while (stmt.step()) {
		let card = stmt.getAsObject();
		if (is_alternative(card.id, card.alias, card.type))
			continue;

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

		// cid
		card.cid = cid_table[card.id] ? cid_table[card.id] : null;
		card.jp_name = name_table[card.id] ? name_table[card.id] : null;
		card.en_name = name_table_en[card.id] ? name_table_en[card.id] : null;

		ret.push(card);
	}
	stmt.free();
}

function compare_type(a, b) {
	let jp_name = name ? name.toHalfWidth() : "";
	let en_name = name ? name.toLowerCase() : "";
	if (a.name === name) {
		return -1;
	}
	else if (b.name === name) {
		return 1;
	}
	else if (a.jp_name && a.jp_name.toHalfWidth() === jp_name) {
		return -1;
	}
	else if (b.jp_name && b.jp_name.toHalfWidth() === jp_name) {
		return 1;
	}
	else if (a.en_name && a.en_name.toLowerCase() === en_name) {
		return -1;
	}
	else if (b.en_name && b.en_name.toLowerCase() === en_name) {
		return 1;
	}
	else if (a.color !== b.color) {
		return a.color - b.color;
	}
	else if (a.level !== b.level) {
		return b.level - a.level;
	}
	else {
		return a.name.localeCompare(b.name);
	}
}

function print_ad(x) {
	if (x === -2)
		return '?';
	else
		return x;
}

function print_data(card){
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

	if(card.type & TYPE_MONSTER){
		mtype = '怪獸';
		if(card.type & TYPE_RITUAL)
			subtype = '/儀式';
		else if(card.type & TYPE_FUSION)
			subtype = '/融合';
		else if(card.type & TYPE_SYNCHRO)
			subtype = '/同步';
		else if(card.type & TYPE_XYZ){
			subtype = '/超量';
			lvstr = `\u2606`;
		}
		else if(card.type & TYPE_LINK){
			subtype = '/連結';
			lvstr = 'LINK-';
		}
		if(card.type & TYPE_PENDULUM){
			subtype += '/靈擺';
		}
		
		// extype
		if(card.type & TYPE_NORMAL)
			subtype += '/通常';
		if(card.type & TYPE_SPIRIT)
			subtype += '/靈魂';
		if(card.type & TYPE_UNION)
			subtype += '/聯合';
		if(card.type & TYPE_DUAL)
			subtype += '/二重';
		if(card.type & TYPE_TUNER)
			subtype += '/協調';
		if(card.type & TYPE_FLIP)
			subtype += '/反轉';
		if(card.type & TYPE_TOON)
			subtype += '/卡通';
		if(card.type & TYPE_SPSUMMON)
			subtype += '/特殊召喚';
		if(card.type & TYPE_EFFECT)
			subtype += '/效果';
		data = `${lfstr}[${mtype}${subtype}]\n`;

		let lv = card.level;
		data += `${lvstr}${lv == 0 ? "?" : lv}`;
		if(card.attribute)
			data += `/${attr_to_str[card.attribute]}`;
		else
			data += '/？';
		if(card.race)
			data += `/${race_to_str[card.race]}族`;
		else
			data += '/？族';
		data += `/攻${print_ad(card.atk)}`;
		if(!(card.type & TYPE_LINK)){
			data += `/守${print_ad(card.def)}`;
		}
		data += '\n';
		if(card.type & TYPE_PENDULUM){
			data += `【靈擺刻度：${card.scale}】\n`;
		}
		if (card.type & TYPE_LINK) {
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
	else if(card.type & TYPE_SPELL){
		mtype = '魔法';
		if(card.type & TYPE_QUICKPLAY)
			subtype = '速攻';
		else if(card.type & TYPE_CONTINUOUS)
			subtype = '永續';
		else if(card.type & TYPE_EQUIP)
			subtype = '裝備';
		else if(card.type & TYPE_RITUAL)
			subtype = '儀式';
		else if(card.type & TYPE_FIELD)
			subtype = '場地';
		else
			subtype = '通常';
		data = `${lfstr}[${subtype}${mtype}]\n`;
	}
	else if(card.type & TYPE_TRAP){
		mtype = '陷阱';
		if(card.type & TYPE_CONTINUOUS)
			subtype = '永續';
		else if(card.type & TYPE_COUNTER)
			subtype = '反擊';
		else
			subtype = '通常';
		data = `${lfstr}[${subtype}${mtype}]\n`;
	}
	let card_text = `**${card.name}**\n${official_name}${data}${card.desc}\n--`;
	return card_text;
}

var arr1 = new Uint8Array(fs.readFileSync('./data/cards.cdb'));
var arr2 = new Uint8Array(fs.readFileSync('./data/pre-release.cdb'));
var db1, db2;

initSqlJs().then(function(SQL){
	db1 = new SQL.Database(arr1);
	db2 = new SQL.Database(arr2);
});

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

// get commnads in ./commands
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

client.once(Events.ClientReady, c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on(Events.MessageCreate, async msg => {
	let cmd = msg.content.substring(0, 3);
	let search_string = msg.content.substring(3, INPUT_LIMIT);
	if (cmd === 'q! ' || cmd === 'n! ') {
		let result = [];
		let arg = new Object();
		let qstr = "";

		qstr = "SELECT datas.id, ot, alias, type, atk, def, level, attribute, race, name, desc FROM datas, texts WHERE datas.id == texts.id AND abs(datas.id - alias) >= 10 AND NOT type & $token";
		arg.$token = TYPE_TOKEN;
		let name_cmd = process_name('', search_string, arg);
		if (name_cmd) {
			qstr += ` AND (${name_cmd});`;
			name = search_string;
			query_card(db1, qstr, arg, result);
			query_card(db2, qstr, arg, result);
			result.sort(compare_type);
		}
		
		if (result.length) {
			for (let i = 0; i < REPLY_LENGTH && i < result.length; ++i) {
				let ret = '';
				if (cmd === 'q! ') {
					ret = print_data(result[i]);
				}
				else {
					ret = result[i].jp_name ? result[i].jp_name : result[i].id.toString();
				}
				await msg.channel.send(ret);
			}

			let list_card = '其他搜尋結果：\n';
			for (let i = REPLY_LENGTH; i < result.length && i < LIST_LENGTH; ++i) {
				if (cmd === 'q! ') {
					list_card += `${result[i].name}\n`;
				}
				else {
					list_card += `${result[i].jp_name ? result[i].jp_name : result[i].id.toString()}\n`;
				}
			}
			if (result.length > REPLY_LENGTH)
				await msg.channel.send(list_card);
		}
		else {
			await msg.channel.send('沒有符合搜尋的項目。');
		}
	}
});

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand())
		return;

	const command = interaction.client.commands.get(interaction.commandName);
	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

client.login(token);

