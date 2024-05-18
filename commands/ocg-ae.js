import { SlashCommandBuilder } from 'discord.js';
import { autocomplete_default } from '../common_all.js';
import { query_command } from '../common_query.js';
const request_locale = 'ae';

export const url = import.meta.url;
export const data = new SlashCommandBuilder()
	.setName('ocg-ae')
	.setDescription('Find a card by name.')
	.addStringOption(option => option.setName('input')
		.setDescription('Card name')
		.setRequired(true)
		.setMaxLength(100)
		.setAutocomplete(true)
	);
data.integration_types = [0, 1];
export const cooldown = 2;
export async function autocomplete(interaction) {
	await autocomplete_default(interaction, request_locale);
}
export async function execute(interaction) {
	await query_command(interaction, request_locale, request_locale);
}
