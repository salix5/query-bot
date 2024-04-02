import { SlashCommandBuilder } from 'discord.js';
import { autocomplete_default } from '../common_all.js';
import { query_command } from '../common_query.js';
const request_locale = 'en';

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
	await autocomplete_default(interaction, request_locale);
}
export async function execute(interaction) {
	await query_command(interaction, request_locale, request_locale);
}
