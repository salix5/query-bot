import { Client, Collection, Events, GatewayIntentBits, ChannelType, MessageType, Partials } from 'discord.js';
import { cid_table, create_name_table, inverse_mapping, name_table } from './ygo-query.mjs';
import { readdirSync } from 'node:fs';
//import 'dotenv/config';

// eslint-disable-next-line no-unused-vars
const re_wildcard = /(^|[^$])[%_]/;

const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages],
	partials: [Partials.Channel]
});

client.cooldowns = new Collection();
client.commands = new Collection();
client.frequency = new Collection();
const commandsURL = new URL('commands/', import.meta.url);
const commandFiles = readdirSync(commandsURL).filter(file => file.endsWith('.js'));
const import_list = [];
const url_list = [];
for (const file of commandFiles) {
	const fileURL = new URL(file, commandsURL);
	import_list.push(import(fileURL));
	url_list.push(fileURL.href);
}

const commands = await Promise.all(import_list);
for (let i = commands.length - 1; i >= 0; --i) {
	const command = commands[i];
	const commandURL = url_list[i];
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
		client.frequency.set(command.data.name, 0);
	} else {
		console.log(`[WARNING] The command at ${commandURL} is missing a required "data" or "execute" property.`);
	}
}

client.once(Events.ClientReady, c => {
	let currentDate = new Date();
	console.log(`[${currentDate.toUTCString()}] Ready! Logged in as ${c.user.tag} (total: ${name_table['ja'].size})`);
	const test_table = create_name_table();
	console.log('name_table_tw:', test_table.size === cid_table.size);
	inverse_mapping(test_table);
});

client.on(Events.MessageCreate, async msg => {
	if (msg.author.id === msg.client.user.id)
		return;
	if (msg.channel.type === ChannelType.DM) {
		console.log(msg.author.id);
		console.log(msg.content.substring(0, 20));
		if (msg.content === "d!") {
			let history = await msg.channel.messages.fetch();
			history.each((message) => {
				if (message.type === MessageType.ChatInputCommand) {
					try {
						message.delete();
					}
					catch (error) {
						console.error('delete DM');
						console.error(error);
					}
				}
			});
		}
	}
	else if (msg.channel.type === ChannelType.GuildText) {
		if (msg.content) {
			msg.react('🤖');
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

		const { cooldowns, frequency } = interaction.client;
		if (!cooldowns.has(command.data.name)) {
			cooldowns.set(command.data.name, new Collection());
			console.log('start:', command.data.name);
		}
		let x = frequency.get(command.data.name);
		++x;
		frequency.set(command.data.name, x);
		if (x % 10 === 0)
			console.log(`#${command.data.name}:`, x);

		const defaultCooldownDuration = 0;
		const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1000;
		if (cooldownAmount) {
			const timestamps = cooldowns.get(command.data.name);
			const now = Date.now();
			if (timestamps.has(interaction.user.id)) {
				const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
				if (now < expirationTime) {
					const expiredTimestamp = Math.round(expirationTime / 1000);
					try {
						await interaction.reply({ content: `CD: <t:${expiredTimestamp}:R>`, ephemeral: true });
					}
					catch (error) {
						console.error(interaction.user.id);
						console.error(interaction.commandName);
						console.error(error);
					}
					return;
				}
			}
			timestamps.set(interaction.user.id, now);
			setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
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
			catch { /* empty */ }
		}
	}
	else if (interaction.isAutocomplete()) {
		const begin = Date.now();
		const command = interaction.client.commands.get(interaction.commandName);
		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
			await command.autocomplete(interaction);
		}
		catch (error) {
			const fail_time = new Date();
			const begin_time = new Date(begin);
			console.error(`autocomplete in ${interaction.commandName}:`, interaction.options.getFocused());
			console.error('begin at', begin_time.toTimeString());
			console.error('fail at', fail_time.toTimeString());
			console.error(error);
		}
	}
});

client.on(Events.Error, (err) => {
	console.error(err);
});

client.login(process.env.TOKEN);
