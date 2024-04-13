import { SlashCommandBuilder } from 'discord.js';
import { get_name } from '../ygo-query.mjs';
import { autocomplete_default, choice_table } from '../common_all.js';

export const url = import.meta.url;
export const data = new SlashCommandBuilder()
	.setName('jp-name')
	.setDescription('中文卡名轉換成日文卡名')
	.addStringOption(option => option.setName('input')
		.setDescription('卡名')
		.setRequired(true)
		.setMaxLength(50)
		.setAutocomplete(true)
	);
export async function autocomplete(interaction) {
	await autocomplete_default(interaction, 'zh-tw');
}
export async function execute(interaction) {
	const input = interaction.options.getString('input');
	const cid = choice_table['zh-tw'].get(input);
	const jp_name = cid ? get_name(cid, 'ja') : '';
	if (jp_name) {
		await interaction.reply(jp_name);
	}
	else {
		await interaction.reply('沒有符合條件的卡片。');
	}
}
