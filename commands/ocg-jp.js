import { SlashCommandBuilder } from 'discord.js';
import { inverse_mapping } from '../ygo-query.js';
import { autocomplete_jp } from '../common_all.js';
import { query_command } from '../common_query.js';
import choice_table from '../commands_data/choices_jp.json' assert { type: 'json' };
import choice_ruby from '../commands_data/choices_ruby.json' assert { type: 'json' };
const choice_inverse = inverse_mapping(choice_table);

export const data = new SlashCommandBuilder()
	.setName('ocg-jp')
	.setDescription('カードを検索します。')
	.addStringOption(option => option.setName('input')
		.setDescription('カード名')
		.setRequired(true)
		.setMaxLength(50)
		.setAutocomplete(true)
	);
export const cooldown = 2;
export async function autocomplete(interaction) {
	await autocomplete_jp(interaction, choice_table, choice_ruby, choice_inverse);
}
export async function execute(interaction) {
	const input = interaction.options.getString('input');
	const id = choice_table[input];
	await query_command(interaction, id, 'ja');
}
