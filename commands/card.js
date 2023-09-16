"use strict";
const { SlashCommandBuilder } = require('discord.js');
const { autocomplete } = require('../common_all.js');
const common2 = require('../common_query.js');
const choice_table = require('../commands_data/choices_tc.json');
const choices_tc_pre = require('../commands_data/choices_tc_pre.json');
Object.assign(choice_table, choices_tc_pre);

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
		await autocomplete(interaction, choice_table);
	},
	async execute(interaction) {
		await common2.query_command(interaction, choice_table);
	},
};
