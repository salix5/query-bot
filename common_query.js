"use strict";
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const ygo = require('./ygo-query.js');

const lang = {
	'zh-tw': {
		none: '沒有符合條件的卡片。',
	},
	'ja': {
		none: '該当データがありません。',
	},
	'ko': {
		none: '검색과 일치하는 카드가 없습니다.',
	},
	'en': {
		none: 'No cards were found.',
	},
};

async function fetch_desc(card, request_locale) {
	const re_ptext = /<div class="frame pen_effect">.*?<div class="item_box_text">.*?([^\r\n\t]+).*?<\/div>/s;
	const re_text = /<div class="text_title">.*?<\/div>.*?([^\r\n\t]+).*?<\/div>/s;
	if (!card.cid)
		return '';
	let raw_data = await fetch(ygo.print_db_link(card.cid, request_locale)).then(response => response.text());
	let ctext = '';
	let res_text = re_text.exec(raw_data);
	if (res_text) {
		ctext = res_text[1].replaceAll('<br>', '\n');
	}
	if (card.type & ygo.TYPE_PENDULUM) {
		let ptext = '';
		let res_ptext = re_ptext.exec(raw_data);
		if (res_ptext) {
			ptext = res_ptext[1].replaceAll('<br>', '\n');
		}
		return `${ptext}\n========\n${ctext}\n`;
	}
	else {
		return `${ctext}\n`;
	}
}

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
			.setURL(ygo.print_db_link(card.cid, request_locale))
			.setLabel('DB');
		row1.addComponents(button1);
		if (request_locale === 'ja') {
			const button2 = new ButtonBuilder()
				.setStyle(ButtonStyle.Link)
				.setLabel('Q&A')
				.setURL(ygo.print_qa_link(card.cid));
			row1.addComponents(button2);
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
				if (locale !== 'zh-tw')
					card.db_desc = await fetch_desc(card, locale);
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
