"use strict";
const { SlashCommandBuilder } = require('discord.js');
const { filter_choice, MAX_CHOICE } = require('../common_all.js');
const { query_command } = require('../common_query.js');
const choice_table = require('../commands_data/choices_jp.json');
const choice_ruby = require('../commands_data/choices_ruby.json');
const name_table = require('../data/name_table.json');

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
		const focused = interaction.options.getFocused();
		var ret = filter_choice(focused, choice_table);
		const id_list = [];
		/*if (focused && ret.length < MAX_CHOICE) {
			const ruby_max_length = MAX_CHOICE - ret.length;
			const starts_with = [];
			const other = [];

			for (const choice of ret) {
				id_list.push(choice_table[choice]);
			}
			const ruby_result = Object.keys(choice_ruby).filter((choice) => choice.includes(focused) && !id_list.includes(choice_ruby[choice]));
			for (const choice of ruby_result) {
				if (choice.startsWith(focused))
					starts_with.push(name_table[choice_ruby[choice]]);
				else
					other.push(name_table[choice_ruby[choice]]);
				if (starts_with.length >= ruby_max_length)
					break;
			}
			const ruby_ret = starts_with.concat(other);
			if (ruby_ret.length > ruby_max_length)
				ruby_ret.length = ruby_max_length;
			ret = ret.concat(ruby_ret);
		}*/
		await interaction.respond(
			ret.map(choice => ({ name: choice, value: choice })),
		);
	},
	async execute(interaction) {
		const input = interaction.options.getString('input');
		const id = choice_table[input];
		await query_command(interaction, id, 'ja');
	},
};
