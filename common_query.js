import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Collection, MessageFlags } from 'discord.js';
import { monster_types } from './ygo-constant.mjs';
import { language_pack, official_name, get_pack_name } from './ygo-json-loader.mjs';
import { get_card, get_request_locale, get_seventh_xyz, print_card, print_db_link, print_qa_link } from './ygo-query.mjs';
import { fetch_text } from './ygo-fetch.mjs';
import { choice_table } from './common_all.js';

const reply_text = {
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
const search_count = new Collection();

export { reply_text, search_count };

const max_size = 1 * 1024 * 1024;
const timeout = 5000;

async function fetch_desc(card, request_locale) {
	if (!Number.isSafeInteger(card.cid) || !official_name[request_locale])
		return '';
	const raw_data = await fetch_text(print_db_link(card.cid, request_locale), max_size, timeout);
	const re_ptext = /<div class="frame pen_effect">.*?<div class="item_box_text">.*?([^\r\n\t]+).*?<\/div>/s;
	const re_text = /<div class="text_title">.*?<\/div>.*?([^\r\n\t]+).*?<\/div>/s;
	const res_text = re_text.exec(raw_data);
	if (!res_text) {
		console.error('Failed to extract text:', card.cid, request_locale);
		return '';
	}
	const ctext = res_text[1].replaceAll('<br>', '\n');
	if (card.type & monster_types.TYPE_PENDULUM) {
		const res_ptext = re_ptext.exec(raw_data);
		let ptext;
		if (!res_ptext) {
			console.error('Failed to extract pendulum text:', card.cid, request_locale);
			ptext = '???';
		}
		else {
			const raw_ptext = (res_ptext[1] === '</div>') ? '' : res_ptext[1];
			ptext = raw_ptext.replaceAll('<br>', '\n');
		}
		const strings = language_pack[request_locale]?.strings ?? language_pack['en']?.strings;
		return `【${strings.text_name.pendulum_effect}】\n${ptext}\n【${strings.type_name[monster_types.TYPE_EFFECT]}】\n${ctext}\n`;
	}
	return `${ctext}\n`;
}

/**
 * Create the reply of `card` in region `locale`.
 * @param {import('./ygo-query.mjs').Card} card 
 * @param {string} locale 
 * @returns
 */
export function create_reply(card, locale) {
	const msg = {};
	msg.content = print_card(card, locale);
	msg.components = [];
	const pack_name = get_pack_name(card.id);
	const request_locale = get_request_locale(card, locale);
	const seventh_list = get_seventh_xyz(card);
	if (card.cid && request_locale !== 'md') {
		const db_text = request_locale === 'en' ? 'DB (TCG)' : 'DB';
		const row_db = new ActionRowBuilder();
		const button1 = new ButtonBuilder()
			.setStyle(ButtonStyle.Link)
			.setURL(print_db_link(card.cid, request_locale))
			.setLabel(db_text);
		row_db.addComponents(button1);
		if (request_locale === 'ja') {
			const button2 = new ButtonBuilder()
				.setStyle(ButtonStyle.Link)
				.setLabel('Q&A')
				.setURL(print_qa_link(card.cid));
			row_db.addComponents(button2);
		}
		if (seventh_list.length) {
			const button3 = new ButtonBuilder()
				.setStyle(ButtonStyle.Primary)
				.setLabel('七皇')
				.setCustomId(`${request_locale}${card.id}`);
			row_db.addComponents(button3);
		}
		msg.components.push(row_db);
	}
	else if (pack_name) {
		const card_locale = (card.ot === 2) ? 'EN' : 'JP';
		const pack_index = (card.id % 1000).toString().padStart(3, '0');
		const card_number = `${pack_name}-${card_locale}${pack_index}`;
		const row1 = new ActionRowBuilder();
		const button1 = new ButtonBuilder()
			.setStyle(ButtonStyle.Link)
			.setURL(`https://yugipedia.com/wiki/${card_number}`)
			.setLabel(card_number);
		row1.addComponents(button1);
		if (seventh_list.length) {
			const button_seventh = new ButtonBuilder()
				.setStyle(ButtonStyle.Primary)
				.setLabel('七皇')
				.setCustomId(`${request_locale}${card.id}`);
			row1.addComponents(button_seventh);
		}
		msg.components.push(row1);
	}
	return msg;
}

/**
 * The handler of query slash command.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction 
 * @param {string} input_locale 
 * @param {string} output_locale 
 */
export async function query_command(interaction, input_locale, output_locale) {
	const input = interaction.options.getString('input');
	if (choice_table[input_locale] && choice_table[input_locale].has(input)) {
		const id = choice_table[input_locale].get(input);
		const card = get_card(id);
		if (card) {
			let count = search_count.ensure(card.id, () => 0);
			count++;
			search_count.set(card.id, count);
			if (output_locale === 'zh-tw') {
				await interaction.reply(create_reply(card, output_locale));
			}
			else {
				await interaction.deferReply();
				let db_desc;
				try {
					db_desc = await fetch_desc(card, get_request_locale(card, output_locale));
				}
				catch (error) {
					console.error(error);
					await interaction.editReply('Network error.');
					return;
				}
				if (!db_desc) {
					await interaction.editReply('Parse error.');
					return;
				}
				card.text.db_desc = db_desc;
				await interaction.editReply(create_reply(card, output_locale));
			}
		}
		else {
			console.error('invalid card id', id);
			await interaction.reply(reply_text[output_locale].none);
		}
	}
	else {
		await interaction.reply(reply_text[output_locale].none);
	}
}

/**
 * Seventh button handler
 * @param {import('discord.js').ButtonInteraction} interaction 
 */
export async function seventh_handler(interaction) {
	const msg = {};
	msg.flags = MessageFlags.Ephemeral;
	const re_number = /\w?No.10[1-7]/;
	const request_locale = interaction.customId.substring(0, 2);
	const id = Number.parseInt(interaction.customId.substring(2), 10) || 0;
	const card = get_card(id);
	if (!card) {
		console.error('invalid customId', interaction.customId);
		msg.content = 'invalid button';
		await interaction.reply(msg);
		return;
	}
	const seventh_list = get_seventh_xyz(card);
	const row_seventh = new ActionRowBuilder();
	for (const seventh of seventh_list) {
		const match = seventh.tw_name.match(re_number);
		const label = match ? match[0] : 'No.10X';
		const button1 = new ButtonBuilder()
			.setStyle(ButtonStyle.Link)
			.setLabel(label)
			.setURL(print_db_link(seventh.cid, request_locale));
		row_seventh.addComponents(button1);
	}
	msg.content = '時空の七皇\nSeventh Tachyon\nRelated cards: ';
	msg.components = [];
	msg.components.push(row_seventh);
	await interaction.reply(msg);
}
