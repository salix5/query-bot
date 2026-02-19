import { readdirSync } from 'node:fs';
import { Client, Collection, Events, GatewayIntentBits, ChannelType, Partials, MessageFlags } from 'discord.js';
import { name_table } from './ygo-query.mjs';
import { seventh_handler } from './common_query.js';
import { deploy_command } from './deploy-commands.js';

const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages],
	partials: [Partials.Channel]
});

client.cooldowns = new Collection();
client.commands = new Collection();
client.frequency = new Collection();
const commandsURL = new URL('./commands/', import.meta.url);
const commandFiles = readdirSync(commandsURL).filter(file => file.endsWith('.js'));
const import_list = [];
for (const file of commandFiles) {
	const fileURL = new URL(file, commandsURL);
	import_list.push(import(fileURL));
}

const commands = await Promise.all(import_list);
for (const command of commands) {
	if (Object.hasOwn(command, 'data') && Object.hasOwn(command, 'execute')) {
		client.commands.set(command.data.name, command);
		client.frequency.set(command.data.name, 0);
	} else {
		console.error(`[WARNING] The command at ${command.module_url} is missing a required "data" or "execute" property.`);
	}
}

client.once(Events.ClientReady, c => {
	const currentDate = new Date();
	console.log(`[${currentDate.toUTCString()}] Ready! Logged in as ${c.user.tag} (total: ${Object.keys(name_table['ja']).length})`);
});

client.on(Events.MessageCreate, async msg => {
	if (msg.author.id === msg.client.user.id)
		return;
	if (msg.channel.type === ChannelType.DM) {
		console.log(msg.author.id);
		console.log(msg.content.substring(0, 20));
		if (msg.content === 'd!') {
			const history = await msg.channel.messages.fetch();
			const delete_list = [];
			history.each((old_message) => {
				if (old_message.author.id === msg.client.user.id) {
					try {
						delete_list.push(old_message.delete());
					}
					catch (error) {
						console.error('delete DM');
						console.error(error);
					}
				}
			});
			await Promise.all(delete_list);
		}
		if (msg.author.id === process.env.ADMIN) {
			if (msg.content === 'r!') {
				await msg.channel.send('🤖');
				await msg.client.destroy();
				process.exit();
			}
			else if (msg.content === 'deploy!') {
				await deploy_command(commands);
			}
		}
	}
	else if (msg.channel.type === ChannelType.GuildText) {
		if (msg.content) {
			try {
				await msg.react('🤖');
			}
			catch (error) {
				console.error(`Failed to react in ${msg.channel.name}:`, error);
			}
		}
	}
});

client.on(Events.InteractionCreate, async interaction => {
	const command = interaction.client.commands.get(interaction.commandName);
	const { cooldowns, frequency } = interaction.client;
	if (interaction.isChatInputCommand()) {
		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}
		let x = frequency.get(command.data.name);
		x++;
		frequency.set(command.data.name, x);
		if (x == 1)
			console.log('start:', command.data.name);
		else if (x % 10 === 0)
			console.log(`#${command.data.name}:`, x);

		const defaultCooldownDuration = 0;
		const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1000;
		if (cooldownAmount) {
			const timestamps = cooldowns.ensure(command.data.name, () => new Collection());
			const now = Date.now();
			if (timestamps.has(interaction.user.id)) {
				const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
				if (now < expirationTime) {
					const expiredTimestamp = Math.round(expirationTime / 1000);
					try {
						await interaction.reply({ content: `Cooldown: <t:${expiredTimestamp}:R>`, flags: MessageFlags.Ephemeral });
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
				if (interaction.replied || interaction.deferred) {
					await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
				}
				else {
					await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
				}
			}
			catch { /* empty */ }
		}
	}
	else if (interaction.isAutocomplete()) {
		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}
		const begin = Date.now();
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
	else if (interaction.isMessageContextMenuCommand()) {
		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}
		let x = frequency.get(command.data.name);
		x++;
		frequency.set(command.data.name, x);
		if (x == 1)
			console.log('start:', command.data.name);
		else if (x % 10 === 0)
			console.log(`#${command.data.name}:`, x);
		try {
			await command.execute(interaction);
		}
		catch (error) {
			console.error(interaction.commandName);
			console.error(error);
			try {
				if (interaction.replied) {
					await interaction.followUp({ content: '刪除失敗，可能原因：不能檢視頻道。', flags: MessageFlags.Ephemeral });
				}
				else {
					await interaction.reply({ content: '刪除失敗，可能原因：不能檢視頻道。', flags: MessageFlags.Ephemeral });
				}
			}
			catch { /* empty */ }
		}
	}
	else if (interaction.isButton()) {
		try {
			await seventh_handler(interaction);
		}
		catch (error) {
			console.error(error);
		}
	}
});

client.on(Events.Error, (err) => {
	console.error(err);
});

client.login(process.env.TOKEN);
