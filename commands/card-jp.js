const { SlashCommandBuilder } = require('discord.js');
const choice_table = require('../data/choices_jp.json');
const ygo = require('../ygo-query.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('card-jp')
		.setDescription('以日文卡名搜尋卡片')
		.addStringOption(option => 
			option.setName('input')
				.setDescription('卡名')
				.setRequired(true)
				.setMaxLength(50)
				.setAutocomplete(true)
	),
	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused().toLowerCase();
		if (!focusedValue) {
			await interaction.respond([]);
			return;
		}
		const filtered = Object.keys(choice_table).filter(choice => choice.toLowerCase().includes(focusedValue));
		const ret = ygo.split_keys(filtered, focusedValue);
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
			let result = [];
			ygo.query_id(id, result);
			if (result.length == 1)
				await interaction.reply(ygo.print_data(result[0]));
			else
				await interaction.reply('沒有符合條件的卡片。');
		}
		else {
			await interaction.reply('沒有符合條件的卡片。');
		}
	},
};
