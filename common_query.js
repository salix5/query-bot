"use strict";
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const ygo = require('./ygo-query.js');

function create_reply(card) {
	if (card.cid) {
		const row1 = new ActionRowBuilder();
		const button1 = new ButtonBuilder()
			.setStyle(ButtonStyle.Link)
			.setURL(ygo.print_db_link(card.cid, card.ot));
		if (card.ot !== 2) {
			button1.setLabel('DB');
			row1.addComponents(button1);
			const button2 = new ButtonBuilder()
				.setStyle(ButtonStyle.Link)
				.setLabel('Q&A')
				.setURL(ygo.print_qa_link(card.cid));
			row1.addComponents(button2);
		}
		else {
			button1.setLabel('DB (TCG)');
			row1.addComponents(button1);
		}
		return { content: ygo.print_card(card), components: [row1] };
	}
	else if (card.cid === 0) {
		const button1 = new ButtonBuilder()
			.setStyle(ButtonStyle.Link)
			.setLabel('Yugipedia')
			.setURL(ygo.print_wiki_link(card.id));
		const row1 = new ActionRowBuilder().addComponents(button1);
		return { content: ygo.print_card(card), components: [row1] };
	}
	else {
		return ygo.print_card(card);
	}
}

module.exports = {
	create_reply: create_reply,

	async query_command(interaction, id) {
		if (id) {
			const card = ygo.get_card(id);
			if (card) {
				await interaction.reply(create_reply(card));
			}
			else {
				await interaction.reply('沒有符合條件的卡片。');
				console.error('Error card id', id);
			}
		}
		else {
			await interaction.reply('沒有符合條件的卡片。');
		}
	},
};
