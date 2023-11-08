import { SlashCommandBuilder } from 'discord.js';
import { autocomplete_default } from '../common_all.js';
import { query_command } from '../common_query.js';
import choice_table from '../commands_data/choices_tc.json' assert { type: 'json' };
import choices_tc_pre from '../commands_data/choices_tc_pre.json' assert { type: 'json' };
Object.assign(choice_table, choices_tc_pre);

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
