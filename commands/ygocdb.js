import { SlashCommandBuilder } from 'discord.js';
import { autocomplete_default } from '../common_all.js';
import choice_table from '../commands_data/choices_tc.json' assert { type: 'json' };

export const data = new SlashCommandBuilder()
	.setName('ygocdb')
	.setDescription('裁定相關連結')
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
		await interaction.reply(`https://ygocdb.com/card/${id}`);
	}
	else {
		await interaction.reply('沒有符合條件的卡片。');
	}
}
