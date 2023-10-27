"use strict";
const { SlashCommandBuilder } = require('discord.js');
const { inverse_mapping, autocomplete_jp } = require('../common_all.js');
const { query_command } = require('../common_query.js');
const choice_table = require('../commands_data/choices_jp.json');
const choice_ruby = require('../commands_data/choices_ruby.json');
const choice_inverse = inverse_mapping(choice_table);

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ocg-jp')
		.setDescription('カードを検索します。')
		.addStringOption(option =>
			option.setName('input')
				.setDescription('カード名')
				.setRequired(true)
				.setMaxLength(50)
				.setAutocomplete(true)
		),
	cooldown: 2,
	async autocomplete(interaction) {
		await autocomplete_jp(interaction, choice_table, choice_ruby, choice_inverse);
	},
	async execute(interaction) {
		const input = interaction.options.getString('input');
		const id = choice_table[input];
		await query_command(interaction, id, 'ja');
	},
};
