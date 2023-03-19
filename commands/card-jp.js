"use strict";
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');
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
		if (id) {
			let result = [];
			ygo.query_id(id, result);
			if (result.length === 1) {
				const card = result[0];
				if (card.cid) {
					const locale = (card.ot === 2) ? 'en' : 'ja';
					const button1 = new ButtonBuilder()
						.setStyle(ButtonStyle.Link)
						.setLabel('DB')
						.setURL(`https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=${card.cid}&request_locale=${locale}`);
					const row1 = new ActionRowBuilder()
						.addComponents(button1);
					if (locale === 'ja') {
						const button2 = new ButtonBuilder()
							.setStyle(ButtonStyle.Link)
							.setLabel('Q&A')
							.setURL(`https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=${card.cid}&request_locale=ja`);
						row1.addComponents(button2);
					}
					await interaction.reply({ content: ygo.print_data(result[0]), components: [row1] });
				}
				else {
					await interaction.reply(ygo.print_data(result[0]));
				}
			}
			else {
				await interaction.reply('沒有符合條件的卡片。');
			}
		}
		else {
			await interaction.reply('沒有符合條件的卡片。');
		}
	},
};
