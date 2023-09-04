"use strict";
const { Client, Collection, Events, GatewayIntentBits, PermissionFlagsBits, ChannelType, MessageType, Partials } = require('discord.js');
require('dotenv').config();
const ygoQuery = require('./ygo-query.js');
const fs = require('node:fs');
const path = require('node:path');
const name_table = require('./data/name_table.json');
const setname = require('./data/setname.json');

const MAX_RESULT_LEN = 200;
const REPLY_LENGTH = 5;
const LIST_LENGTH = 20;
const INPUT_LIMIT = 50;
const re_wildcard = /(^|[^\$])[%_]/;

String.prototype.toHalfWidth = function () {
	return this.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (s) { return String.fromCharCode(s.charCodeAt(0) - 0xFEE0) });
};

String.prototype.toFullWidth = function () {
	return this.replace(/[A-Za-z0-9]/g, function (s) { return String.fromCharCode(s.charCodeAt(0) + 0xFEE0); });
};

function string_to_literal(str) {
	return re_wildcard.test(str) ? str : `%${str}%`;
}

// return: name_cmd
// en: table, ja: table, zh: query
function process_name(locale, str_name, arg) {
	if (!str_name)
		return "";
	const setcode_str = ` OR ${ygoQuery.setcode_condition("$setcode")}`;
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
				if (value && value.toHalfWidth().toLowerCase().includes(str_jp))
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
				const mapObj = Object.create(null);
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
			name_cmd += ` OR alias IN (${ygoQuery.stmt_no_alias} AND name LIKE $name ESCAPE '$')`;
			arg.$name = string_to_literal(str_name);
			arg.$kanji = `%※${string_to_literal(str_name)}`;
			break;
	}
	return name_cmd;
}

/** 
 *  is_equal() - case-insensitive equal
 *  @param {string} a
 *  @param {string} b
 */
function is_equal(a, b) {
	return a.toHalfWidth().toLowerCase() === b.toHalfWidth().toLowerCase();
}

function compare_card(name) {
	return function (a, b) {
		if (is_equal(a.name, name)) {
			return -1;
		}
		else if (is_equal(b.name, name)) {
			return 1;
		}
		else if (a.jp_name && is_equal(a.jp_name, name)) {
			return -1;
		}
		else if (b.jp_name && is_equal(b.jp_name, name)) {
			return 1;
		}

		if (a.color !== b.color) {
			return a.color - b.color;
		}
		else if (a.level !== b.level) {
			return b.level - a.level;
		}
		else {
			return a.name.localeCompare(b.name, 'zh-Hant');
		}
	}
}

const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages],
	partials: [Partials.Channel]
});

client.cooldowns = new Collection();
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
	let currentDate = new Date();
	console.log(`[${currentDate.toUTCString()}] Ready! Logged in as ${c.user.tag}`);
});

client.on(Events.MessageCreate, async msg => {
	if (msg.inGuild()) {
		if (!msg.guild.available)
			return;
		if (!msg.channel.permissionsFor(msg.guild.members.me).has(PermissionFlagsBits.SendMessages))
			return;

		let cmd = msg.content.substring(0, 3);
		let search_string = msg.content.substring(3, INPUT_LIMIT);
		if (cmd === 'q! ' || cmd === 'n! ') {
			const { cooldowns } = msg.client;
			if (!cooldowns.has(cmd)) {
				cooldowns.set(cmd, new Collection());
			}
			const now = Date.now();
			const timestamps = cooldowns.get(cmd);
			const cooldownAmount = 4000;

			if (timestamps.has(msg.channel.id)) {
				const expirationTime = timestamps.get(msg.channel.id) + cooldownAmount;
				if (now < expirationTime) {
					const expiredTimestamp = Math.round(expirationTime / 1000);
					return;
				}
			}
			timestamps.set(msg.channel.id, now);
			setTimeout(() => timestamps.delete(msg.channel.id), cooldownAmount);

			let result = [];
			let arg = new Object();
			let qstr = ygoQuery.stmt_default;
			let name_cmd = process_name('', search_string, arg);
			if (name_cmd) {
				qstr += ` AND (${name_cmd});`;
				ygoQuery.query(qstr, arg, result);
				result.sort(compare_card(search_string));
			}

			if (result.length) {
				for (let i = 0; i < Math.min(REPLY_LENGTH, result.length); ++i) {
					let ret = '';
					if (cmd === 'q! ') {
						ret = ygoQuery.print_data(result[i]);
					}
					else {
						ret = result[i].jp_name ? result[i].jp_name : result[i].id.toString();
					}

					try {
						await msg.channel.send(ret);
					}
					catch (error) {
						console.error(msg.content);
						console.error(error);
						return;
					}
				}
				if (result.length > REPLY_LENGTH) {
					let list_card = '其他搜尋結果：\n';
					for (let i = REPLY_LENGTH; i < Math.min(LIST_LENGTH, result.length); ++i) {
						if (cmd === 'q! ') {
							list_card += `${result[i].name}\n`;
						}
						else {
							list_card += `${result[i].jp_name ? result[i].jp_name : result[i].id.toString()}\n`;
						}
					}

					try {
						await msg.channel.send(list_card);
					}
					catch (error) {
						console.error(msg.content);
						console.error(error);
					}
				}
			}
			else {
				try {
					await msg.channel.send('沒有符合條件的卡片。');
				}
				catch (error) {
					console.error(msg.content);
					console.error(error);
				}
			}
		}
	}
	else if (msg.channel.type === ChannelType.DM) {
		if (msg.content === "d!") {
			let history = await msg.channel.messages.fetch({ force: true });
			let list_delete = [];
			history.each((message) => {
				if (message.type === MessageType.ChatInputCommand)
					list_delete.push(message);
			});
			for (const message of list_delete) {
				await message.delete();
			}
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
			console.error(interaction.commandName);
			console.error(error);
			try {
				await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
			}
			catch { }
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
			console.error(interaction.commandName, interaction.options.getFocused());
			console.error(error);
		}
	}
});

client.on(Events.Error, (err) => {
	console.error(err);
});

ygoQuery.db_ready.then(() => {
	client.login(process.env.TOKEN);
});
