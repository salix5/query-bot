import { SlashCommandBuilder } from 'discord.js';
import { random_integer } from '../ygo-utility.mjs';

export const module_url = import.meta.url;
export const data = new SlashCommandBuilder()
	.setName('react')
	.setDescription('Send a reaction.');
data.integration_types = [0, 1];
data.contexts = [0, 1, 2];
const emoji_list = [
	'<:Hondoni:1068552863405592666>',
	'<:INDEED:1059390015374897214>',
	'<:Izuna:1498341479490260992>',
];

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction 
 */
export async function execute(interaction) {
	const emoji = emoji_list[await random_integer(emoji_list.length)];
	await interaction.reply(emoji);
}
