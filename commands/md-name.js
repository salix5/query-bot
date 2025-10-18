import { SlashCommandBuilder } from 'discord.js';
import { get_name, id_to_cid } from '../ygo-query.mjs';
import { autocomplete_default, choice_table } from '../common_all.js';

export const module_url = import.meta.url;
export const data = new SlashCommandBuilder()
	.setName('md-name')
	.setDescription('中文卡名轉換成MD簡中譯名')
	.addStringOption(option => option.setName('input')
		.setDescription('卡名')
		.setRequired(true)
		.setMaxLength(50)
		.setAutocomplete(true)
	);
data.integration_types = [0, 1];
data.contexts = [0, 1, 2];
export async function autocomplete(interaction) {
	await autocomplete_default(interaction, 'zh-tw');
}
export async function execute(interaction) {
	const input = interaction.options.getString('input');
	const cid = id_to_cid.get(choice_table['zh-tw'].get(input));
	const card_name = cid ? get_name(cid, 'md') : '';
	if (card_name) {
		await interaction.reply(card_name);
	}
	else {
		await interaction.reply('沒有符合條件的卡片。');
	}
}
