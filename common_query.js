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
					const button1 = new ButtonBuilder()
						.setStyle(ButtonStyle.Link)
						.setLabel('DB')
						.setURL(ygo.print_db_link(card.cid, card.ot));
					const row1 = new ActionRowBuilder().addComponents(button1);
					if (card.ot !== 2) {
						const button2 = new ButtonBuilder()
							.setStyle(ButtonStyle.Link)
							.setLabel('Q&A')
							.setURL(ygo.print_qa_link(card.cid));
						row1.addComponents(button2);
					}
					await interaction.editReply({ content: ygo.print_data(result[0]), components: [row1] });
				}
				else if (card.cid === 0) {
					const button1 = new ButtonBuilder()
						.setStyle(ButtonStyle.Link)
						.setLabel('Yugipedia')
						.setURL(ygo.print_wiki_link(card.id));
					const row1 = new ActionRowBuilder().addComponents(button1);
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
