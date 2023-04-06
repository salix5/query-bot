"use strict";
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const ygo = require('./ygo-query.js');

module.exports = {
	async query_command(interaction, choice_table) {
		const input = interaction.options.getString('input');
		let id = choice_table[input];
		if (id) {
			await interaction.deferReply();
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
					await interaction.editReply({ content: ygo.print_data(result[0]), components: [row1] });
				}
				else {
					await interaction.editReply(ygo.print_data(result[0]));
				}
			}
			else {
				await interaction.editReply('沒有符合條件的卡片。');
				console.error('Error card id', id);
			}
		}
		else {
			await interaction.reply('沒有符合條件的卡片。');
		}
	},
};
