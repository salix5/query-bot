import { SlashCommandBuilder } from 'discord.js';

export const module_url = import.meta.url;
export const data = new SlashCommandBuilder()
	.setName('react')
	.setDescription('Send a reaction.');
data.integration_types = [0];
data.contexts = [0];
const emoji = '<:Hondoni:1068552863405592666>';

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction 
 */
export async function execute(interaction) {
	await interaction.reply({ content: 'Done.', ephemeral: true });
	try {
		await interaction.channel.send({ content: emoji });
	}
	catch { 
		console.error('Failed to send the reaction in:', interaction.channel.name);
	}
}
