"use strict";
const { Client, Collection, Events, GatewayIntentBits, ChannelType, MessageType, Partials } = require('discord.js');
require('dotenv').config();
const ygoQuery = require('./ygo-query.js');
const fs = require('node:fs');
const path = require('node:path');

const re_wildcard = /(^|[^\$])[%_]/;

const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages],
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
	if (msg.channel.type === ChannelType.DM) {
		if (msg.content === "d!") {
			let history = await msg.channel.messages.fetch();
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

		const { cooldowns } = interaction.client;
		if (!cooldowns.has(command.data.name)) {
			cooldowns.set(command.data.name, new Collection());
		}

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
