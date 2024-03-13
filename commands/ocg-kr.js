import { SlashCommandBuilder } from 'discord.js';
import { autocomplete_default } from '../common_all.js';
import { query_command } from '../common_query.js';

export const data = new SlashCommandBuilder()
	.setName('ocg-kr')
	.setDescription('카드를 검색합니다.')
	.addStringOption(option => option.setName('input')
		.setDescription('카드명을')
		.setRequired(true)
		.setMaxLength(100)
		.setAutocomplete(true)
	);
export const cooldown = 2;
export async function autocomplete(interaction) {
	await autocomplete_default(interaction, 'ko');
}
export async function execute(interaction) {
	await query_command(interaction, 'ko', 'ko');
}
