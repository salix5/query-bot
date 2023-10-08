"use strict";
const { SlashCommandBuilder } = require('discord.js');
const { autocomplete } = require('../common_all.js');
const { query_command } = require('../common_query.js');
const choice_table = require('../commands_data/choices_en.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('tcg-en')
		.setDescription('Find a card by name.')
		.addStringOption(option =>
			option.setName('input')
				.setDescription('Card name')
				.setRequired(true)
				.setMaxLength(100)
				.setAutocomplete(true)
		),
	cooldown: 2,
	async autocomplete(interaction) {
		await autocomplete(interaction, choice_table);
	},
	async execute(interaction) {
		const input = interaction.options.getString('input');
		const id = choice_table[input];
		await query_command(interaction, id, 'en');
	},
};
