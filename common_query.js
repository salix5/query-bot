import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import * as ygo from './ygo-query.mjs';
import { choice_table } from './common_all.js';

export const reply_text = {
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
	const raw_data = (await fetch(ygo.print_db_link(card.cid, request_locale))).text();
	const res_text = re_text.exec(raw_data);
	let ctext = '';
	if (res_text) {
		ctext = res_text[1].replaceAll('<br>', '\n');
	}
	if (card.type & ygo.monster_type.TYPE_PENDULUM) {
		let ptext = '';
		const res_ptext = re_ptext.exec(raw_data);
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
 * @param {ygo.Card} card 
 * @param {string} locale 
 * @param {boolean} seventh
 * @returns 
 */
export function create_reply(card, locale) {
	const msg = Object.create(null);
	msg.content = ygo.print_card(card, locale);
	msg.components = [];
	if (card.cid) {
		const request_locale = ygo.get_request_locale(card, locale);
		const db_text = request_locale === 'en' ? 'DB (TCG)' : 'DB';
		const row_db = new ActionRowBuilder();
		const button1 = new ButtonBuilder()
			.setStyle(ButtonStyle.Link)
			.setURL(ygo.print_db_link(card.cid, request_locale))
			.setLabel(db_text);
		row_db.addComponents(button1);
		if (request_locale === 'ja') {
			const button2 = new ButtonBuilder()
				.setStyle(ButtonStyle.Link)
				.setLabel('Q&A')
				.setURL(ygo.print_qa_link(card.cid));
			row_db.addComponents(button2);
		}
		if (ygo.get_seventh_xyz(card).length) {
			const button3 = new ButtonBuilder()
				.setStyle(ButtonStyle.Primary)
				.setLabel('七皇')
				.setCustomId(`${request_locale}${card.cid ?? card.id}`);
			row_db.addComponents(button3);
		}
		msg.components.push(row_db);
	}
	else if (card.cid === 0) {
		const button1 = new ButtonBuilder()
			.setStyle(ButtonStyle.Link)
			.setLabel('Yugipedia')
			.setURL(ygo.print_yp_link(card.id));
		const row1 = new ActionRowBuilder().addComponents(button1);
		msg.components.push(row1);
	}
	return msg;
}

/**
 * The handler of query slash command.
 * @param {ChatInputCommandInteraction} interaction 
 * @param {string} input_locale 
 * @param {string} output_locale 
 */
export async function query_command(interaction, input_locale, output_locale) {
	const input = interaction.options.getString('input');
	if (choice_table[input_locale] && choice_table[input_locale].has(input)) {
		const cid = choice_table[input_locale].get(input);
		const card = ygo.get_card(cid);
		if (card) {
			if (output_locale === 'zh-tw') {
				await interaction.reply(create_reply(card, output_locale));
			}
			else {
				await interaction.deferReply();
				card.text.db_desc = await fetch_desc(card, ygo.get_request_locale(card, output_locale));
				await interaction.editReply(create_reply(card, output_locale));
			}
		}
		else {
			console.error('invalid card cid', cid);
			await interaction.reply(reply_text[output_locale].none);
		}
	}
	else {
		await interaction.reply(reply_text[output_locale].none);
	}
}

/**
 * Seventh button handler
 * @param {ButtonInteraction} interaction 
 */
export async function seventh_handler(interaction) {
	const msg = Object.create(null);
	msg.flags = MessageFlags.Ephemeral;
	const re_number = /\w?No.10[1-7]/;
	const request_locale = interaction.customId.substring(0, 2);
	const id = interaction.customId.substring(2);
	const card = ygo.get_card(id);
	if (!card) {
		console.error('invalid customId', interaction.customId);
		msg.content = 'invalid button';
		await interaction.reply(msg);
		return;
	}
	const seventh_list = ygo.get_seventh_xyz(card);
	const row_seventh = new ActionRowBuilder();
	for (const seventh of seventh_list) {
		const match = seventh.tw_name.match(re_number);
		const label = match ? match[0] : 'No.10X';
		const button1 = new ButtonBuilder()
			.setStyle(ButtonStyle.Link)
			.setLabel(label)
			.setURL(ygo.print_db_link(seventh.cid, request_locale));
		row_seventh.addComponents(button1);
	}
	msg.content = '時空の七皇\nSeventh Tachyon';
	msg.components = [];
	msg.components.push(row_seventh);
	await interaction.reply(msg);
}
