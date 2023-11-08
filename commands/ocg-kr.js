import { SlashCommandBuilder } from 'discord.js';
import { autocomplete_default } from '../common_all.js';
import { query_command } from '../common_query.js';
import choice_table from '../commands_data/choices_kr.json' assert { type: 'json' };

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
	await autocomplete_default(interaction, choice_table);
}
export async function execute(interaction) {
	const input = interaction.options.getString('input');
	const id = choice_table[input];
	await query_command(interaction, id, 'ko');
}
