"use strict";
const { SlashCommandBuilder } = require('discord.js');
const common1 = require('../common_all.js');
const common2 = require('../common_query.js');
const choice_table = require('../data/choices_tc_pre.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('card')
		.setDescription('以中文卡名搜尋卡片')
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
		common2.query_command(interaction, choice_table);
	},
};
