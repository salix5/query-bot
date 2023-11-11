import { SlashCommandBuilder } from 'discord.js';
import { autocomplete_jp, choices_jp as choice_table } from '../common_all.js';
import { query_command } from '../common_query.js';
import choice_ruby from '../commands_data/choices_ruby.json' assert { type: 'json' };

export const data = new SlashCommandBuilder()
	.setName('card-jp')
	.setDescription('以日文卡名搜尋卡片')
	.addStringOption(option => option.setName('input')
		.setDescription('卡名')
		.setRequired(true)
		.setMaxLength(50)
		.setAutocomplete(true)
	);
export async function autocomplete(interaction) {
	await autocomplete_jp(interaction, choice_ruby);
}
export async function execute(interaction) {
	const input = interaction.options.getString('input');
	const id = choice_table[input];
	await query_command(interaction, id, 'zh-tw');
}
