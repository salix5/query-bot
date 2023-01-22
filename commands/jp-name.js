const { SlashCommandBuilder } = require('discord.js');
const choice_table = require('../data/choices_tc.json');
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
		const filtered = Object.keys(choice_table).filter(choice => choice.includes(focusedValue));
		if (filtered.length > 20)
			filtered.length = 20;
		await interaction.respond(
			filtered.map(choice => ({ name: choice, value: `card_${choice_table[choice]}` })),
		);
	},
	async execute(interaction) {
		const input = interaction.options.getString('input');
		if (input.substring(0, 5) === 'card_' && parseInt(input.substring(5), 10)) {
			let id = parseInt(input.substring(5), 10);
			let result = [];
			ygo.query_id(id, result);
			if (result.length == 1)
				await interaction.reply(result[0].jp_name);
			else
				await interaction.reply('沒有符合條件的卡片。');
		}
		else {
			await interaction.reply('沒有符合條件的卡片。');
		}
	},
};
