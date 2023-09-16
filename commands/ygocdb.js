"use strict";
const { SlashCommandBuilder } = require('discord.js');
const { autocomplete } = require('../common_all.js');
const choice_table = require('../commands_data/choices_tc.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ygocdb')
		.setDescription('裁定相關連結')
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
			await interaction.reply(`https://ygocdb.com/card/${id}`);
		}
		else {
			await interaction.reply('沒有符合條件的卡片。');
		}
	},
};
