import { REST, Routes } from 'discord.js';
import { readdirSync } from 'node:fs';

const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
const token = process.env.TOKEN;
const public_commands = [];
const test_commands = [];

const commandsURL = new URL('commands/', import.meta.url);
const commandFiles = readdirSync(commandsURL).filter(file => file.endsWith('.js'));
const import_list = [];
for (const file of commandFiles) {
	const fileURL = new URL(file, commandsURL);
	import_list.push(import(fileURL));
}

// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
const commands = await Promise.all(import_list);
for (const command of commands) {
	if (command.is_test)
		test_commands.push(command.data.toJSON());
	else
		public_commands.push(command.data.toJSON());
}

// Construct and prepare an instance of the REST module
const rest = new REST({ version: '10' }).setToken(token);

// and deploy your commands!
(async () => {
	try {
		console.log(`Started refreshing ${public_commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			//Routes.applicationGuildCommands(clientId, guildId),
			Routes.applicationCommands(clientId),
			{ body: public_commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
	try {
		console.log(`Started refreshing ${test_commands.length} test commands.`);

		const data = await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: test_commands },
		);

		console.log(`Successfully reloaded ${data.length} test commands.`);
	} catch (error) {
		console.error(error);
	}
})();
