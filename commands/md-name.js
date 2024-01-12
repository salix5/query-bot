import { SlashCommandBuilder } from 'discord.js';
import { get_name } from '../ygo-query.mjs';
import { choices_tc } from '../common_all.js';

export const data = new SlashCommandBuilder()
	.setName('md-name')
	.setDescription('中文卡名轉換成MD簡中譯名')
	.addStringOption(option => option.setName('input')
		.setDescription('卡名')
		.setRequired(true)
		.setMaxLength(50)
		.setAutocomplete(true)
	);
export { autocomplete_tc as autocomplete } from '../common_all.js';
export async function execute(interaction) {
	const input = interaction.options.getString('input');
	let id = choices_tc[input];
	if (id) {
		if (get_name(id, 'md'))
			await interaction.reply(get_name(id, 'md'));

		else
			await interaction.reply('MD未收錄。');
	}
	else {
		await interaction.reply('沒有符合條件的卡片。');
	}
}
