import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction } from 'discord.js';
import * as ygo from './ygo-query.mjs';
import { choice_table } from './common_all.js';

const response = {
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
	if (!card.cid || !ygo.official_name[request_locale])
		return '';

	const re_ptext = /<div class="frame pen_effect">.*?<div class="item_box_text">.*?([^\r\n\t]+).*?<\/div>/s;
	const re_text = /<div class="text_title">.*?<\/div>.*?([^\r\n\t]+).*?<\/div>/s;
	let raw_data = await fetch(ygo.print_db_link(card.cid, request_locale)).then(response => response.text());
	let ctext = '';
	let res_text = re_text.exec(raw_data);
	if (res_text) {
		ctext = res_text[1].replaceAll('<br>', '\n');
	}
	if (card.type & ygo.monster_type.TYPE_PENDULUM) {
		let ptext = '';
		let res_ptext = re_ptext.exec(raw_data);
		if (res_ptext) {
			if (res_ptext[1] === '</div>')
				res_ptext[1] = '';
			ptext = res_ptext[1].replaceAll('<br>', '\n');
		}
		return `${ptext}\n【${ygo.lang[request_locale].type_name[ygo.monster_type.TYPE_EFFECT]}】\n${ctext}\n`;
	}
	else {
		return `${ctext}\n`;
	}
}

/**
 * Create the reply of `card` in region `locale`.
 * @param {Object} card 
 * @param {string} locale 
 * @returns 
 */
export function create_reply(card, locale) {
	if (card.cid) {
		let request_locale = ygo.get_request_locale(card, locale);
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
			const button3 = new ButtonBuilder()
				.setStyle(ButtonStyle.Link)
				.setLabel('History')
				.setURL(ygo.print_history_link(card.cid));
			row1.addComponents(button3);
		}
		return { content: ygo.print_card(card, locale), components: [row1] };
	}
	else if (card.cid === 0) {
		const button1 = new ButtonBuilder()
			.setStyle(ButtonStyle.Link)
			.setLabel('Yugipedia')
			.setURL(ygo.print_yp_link(card.id));
		const row1 = new ActionRowBuilder().addComponents(button1);
		return { content: ygo.print_card(card, locale), components: [row1] };
	}
	else {
		return ygo.print_card(card, locale);
	}
}

/**
 * The handler of query slash command.
 * @param {CommandInteraction} interaction 
 * @param {string} input_locale 
 * @param {string} output_locale 
 */
export async function query_command(interaction, input_locale, output_locale) {
	const input = interaction.options.getString('input');
	if (choice_table[input_locale] && choice_table[input_locale].has(input)) {
		const id = choice_table[input_locale].get(input);
		const card = ygo.get_card(id);
		if (card) {
			if (output_locale === 'zh-tw') {
				await interaction.reply(create_reply(card, output_locale));
			}
			else {
				await interaction.deferReply();
				card.db_desc = await fetch_desc(card, ygo.get_request_locale(card, output_locale));
				await interaction.editReply(create_reply(card, output_locale));
			}
		}
		else {
			await interaction.reply(response[output_locale].none);
			console.error('Invalid card id', id);
		}
	}
	else {
		await interaction.reply(response[output_locale].none);
	}
}
