"use strict";
const name_table = require('./data/name_table.json');
const name_table_en = require('./data/name_table_en.json');
const setname = require('./data/setname.json');

require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const ygo = require('./ygo-query.js');

const TYPE_TOKEN = 0x4000
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
				let mapObj = Object.create(null);
				mapObj['$%'] = '%';
				mapObj['$_'] = '_';
				let real_str = str_name.replace(/\$%|\$_/g, (x) => mapObj[x]).toLowerCase();
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

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

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
		let qstr = "SELECT datas.id, ot, alias, type, atk, def, level, attribute, race, name, desc FROM datas, texts WHERE datas.id == texts.id AND abs(datas.id - alias) >= 10 AND NOT type & $token";
		arg.$token = TYPE_TOKEN;
		let name_cmd = process_name('', search_string, arg);
		if (name_cmd) {
			qstr += ` AND (${name_cmd});`;
			name = search_string;
			ygo.query_card(qstr, arg, result);
			result.sort(compare_type);
		}
		
		if (result.length) {
			for (let i = 0; i < REPLY_LENGTH && i < result.length; ++i) {
				let ret = '';
				if (cmd === 'q! ') {
					ret = ygo.print_data(result[i]);
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
			await msg.channel.send('沒有符合條件的卡片。');
		}
	}
});

client.on(Events.InteractionCreate, async interaction => {
	if (interaction.isChatInputCommand()) {
		const command = interaction.client.commands.get(interaction.commandName);
		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
			await command.execute(interaction);
		}
		catch (error) {
			console.error(error);
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
	else if (interaction.isAutocomplete()) {
		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
			await command.autocomplete(interaction);
		}
		catch (error) {
			console.error(error);
		}
	}
});

client.login(process.env.TOKEN);
