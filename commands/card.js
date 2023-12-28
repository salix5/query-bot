import { SlashCommandBuilder } from 'discord.js';
import { autocomplete_default, choices_tc } from '../common_all.js';
import { query_command } from '../common_query.js';
import { create_choice_prerelease } from '../ygo-query.mjs';
const choices_tc_pre = create_choice_prerelease();
const choice_table = { ...choices_tc, ...choices_tc_pre };

export const data = new SlashCommandBuilder()
	.setName('card')
	.setDescription('以中文卡名搜尋卡片')
	.addStringOption(option => option.setName('input')
		.setDescription('卡名')
		.setRequired(true)
		.setMaxLength(50)
		.setAutocomplete(true)
	);
export async function autocomplete(interaction) {
	await autocomplete_default(interaction, choice_table);
}
export async function execute(interaction) {
	const input = interaction.options.getString('input');
	const id = choice_table[input];
	await query_command(interaction, id, 'zh-tw');
}
