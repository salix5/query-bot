const { SlashCommandBuilder } = require('discord.js');
const choice_table = require('../data/choices_tc.json');
const name_table = require('../data/name_table.json');
const ygo = require('../ygo-query.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('jp-name')
		.setDescription('中文卡名轉換成日文卡名')
		.addStringOption(option => 
			option.setName('input')
				.setDescription('卡名')
				.setRequired(true)
				.setMaxLength(50)
				.setAutocomplete(true)
	),
	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused();
		if (!focusedValue) {
			await interaction.respond([]);
			return;
		}
		const ret = ygo.filter_choice(choice_table, focusedValue);
		await interaction.respond(
			ret.map(choice => ({ name: choice, value: choice })),
		);
	},
	async execute(interaction) {
		const input = interaction.options.getString('input');
		let id = choice_table[input];
		if (id && name_table[id]) {
			await interaction.reply(name_table[id]);
		}
		else {
			await interaction.reply('沒有符合條件的卡片。');
		}
	},
};
