const { SlashCommandBuilder } = require('discord.js');
const choice_table = require('../data/choices_tc.json');
const ygo = require('../ygo-query.js');

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
		const focusedValue = interaction.options.getFocused();
		if (!focusedValue) {
			await interaction.respond([]);
			return;
		}
		const ret = ygo.filter_choice(choice_table, focusedValue);
		if (ret.length > 20)
			ret.length = 20;
		await interaction.respond(
			ret.map(choice => ({ name: choice, value: choice })),
		);
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
