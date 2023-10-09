"use strict";
const { SlashCommandBuilder } = require('discord.js');
const { autocomplete } = require('../common_all.js');
const choice_table = require('../commands_data/choices_tc.json');
const ygo = require('../ygo-query.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('md-name')
		.setDescription('中文卡名轉換成MD簡中譯名')
		.addStringOption(option =>
			option.setName('input')
				.setDescription('卡名')
				.setRequired(true)
				.setMaxLength(50)
				.setAutocomplete(true)
		),
	async autocomplete(interaction) {
		await autocomplete(interaction, choice_table);
	},
	async execute(interaction) {
		const input = interaction.options.getString('input');
		let id = choice_table[input];
		if (id) {
			if (ygo.get_name(id, 'md'))
				await interaction.reply(ygo.get_name(id, 'md'));
			else
				await interaction.reply('MD未收錄。');
		}
		else {
			await interaction.reply('沒有符合條件的卡片。');
		}
	},
};
