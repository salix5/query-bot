"use strict";
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const ygo = require('./ygo-query.js');

const lang = {
	"zh-tw": {
		none: "沒有符合條件的卡片。",
	},
	"en": {
		none: "No cards were found.",
	},
};

function create_reply(card, locale) {
	if (card.cid) {
		let request_locale = '';
		if (card.ot !== 2 && card.en_name) {
			if (locale === 'zh-tw')
				request_locale = 'ja';
			else
				request_locale = locale;
		}
		else if (card.ot !== 2) {
			request_locale = 'ja';
		}
		else {
			request_locale = locale;
		}
		const row1 = new ActionRowBuilder();
		const button1 = new ButtonBuilder()
			.setStyle(ButtonStyle.Link)
			.setURL(ygo.print_db_link(card.cid, request_locale));
		if (request_locale === 'ja') {
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
		return { content: ygo.print_card(card, locale), components: [row1] };
	}
	else if (card.cid === 0) {
		const button1 = new ButtonBuilder()
			.setStyle(ButtonStyle.Link)
			.setLabel('Yugipedia')
			.setURL(ygo.print_wiki_link(card.id));
		const row1 = new ActionRowBuilder().addComponents(button1);
		return { content: ygo.print_card(card, locale), components: [row1] };
	}
	else {
		return ygo.print_card(card, locale);
	}
}

module.exports = {
	create_reply: create_reply,

	async query_command(interaction, id, locale) {
		if (id) {
			const card = ygo.get_card(id);
			if (card) {
				await interaction.reply(create_reply(card, locale));
			}
			else {
				await interaction.reply(lang[locale].none);
				console.error('Error card id', id);
			}
		}
		else {
			await interaction.reply(lang[locale].none);
		}
	},
};
