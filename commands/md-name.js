import { SlashCommandBuilder } from 'discord.js';
import { get_name } from '../ygo-query.js';
import { autocomplete_default } from '../common_all.js';
import choice_table from '../commands_data/choices_tc.json' assert { type: 'json' };

export const data = new SlashCommandBuilder()
	.setName('md-name')
	.setDescription('中文卡名轉換成MD簡中譯名')
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
	let id = choice_table[input];
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
