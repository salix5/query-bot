import { SlashCommandBuilder } from 'discord.js';
import { autocomplete_default, choices_tc_full } from '../common_all.js';
import { query_command } from '../common_query.js';

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
	await autocomplete_default(interaction, 'full');
}
export async function execute(interaction) {
	const input = interaction.options.getString('input');
	const id = choices_tc_full[input];
	await query_command(interaction, id, 'zh-tw');
}
