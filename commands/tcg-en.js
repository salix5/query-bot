import { SlashCommandBuilder } from 'discord.js';
import { autocomplete_default, choices_en as choice_table } from '../common_all.js';
import { query_command } from '../common_query.js';

export const data = new SlashCommandBuilder()
	.setName('tcg-en')
	.setDescription('Find a card by name.')
	.addStringOption(option => option.setName('input')
		.setDescription('Card name')
		.setRequired(true)
		.setMaxLength(100)
		.setAutocomplete(true)
	);
export const cooldown = 2;
export async function autocomplete(interaction) {
	await autocomplete_default(interaction, choice_table);
}
export async function execute(interaction) {
	const input = interaction.options.getString('input');
	const id = choice_table[input];
	await query_command(interaction, id, 'en');
}
