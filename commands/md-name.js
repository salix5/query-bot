"use strict";
const { SlashCommandBuilder } = require('discord.js');
const common1 = require('../common_all.js');
const choice_table = require('../data/choices_tc.json');
const name_table_md = require('../data/name_table_md.json');

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
		await common1.autocomplete(interaction, choice_table);
	},
	async execute(interaction) {
		const input = interaction.options.getString('input');
		let id = choice_table[input];
		if (id) {
			if (name_table_md[id])
				await interaction.reply(name_table_md[id]);
			else
				await interaction.reply('MD未收錄。');
		}
		else {
			await interaction.reply('沒有符合條件的卡片。');
		}
	},
};
