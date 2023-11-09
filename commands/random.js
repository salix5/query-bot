import { randomInt } from 'node:crypto';
import { promisify } from 'node:util';
import { SlashCommandBuilder } from 'discord.js';
import { name_table, cid_inverse, get_card } from '../ygo-query.mjs';
import { create_reply } from '../common_query.js';
const rand = promisify(randomInt);

export const data = new SlashCommandBuilder()
	.setName('random')
	.setDescription('從OCG卡池隨機抽一張卡');
export async function execute(interaction) {
	const keys = Object.keys(name_table['ja']);
	const id = cid_inverse[keys[await rand(keys.length)]];
	const card = get_card(id);
	if (card) {
		await interaction.reply(create_reply(card, 'zh-tw'));
	}
	else {
		await interaction.reply('Error');
	}
}
