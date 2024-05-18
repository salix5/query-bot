import { randomInt } from 'node:crypto';
import { promisify } from 'node:util';
import { SlashCommandBuilder } from 'discord.js';
import { name_table, get_card } from '../ygo-query.mjs';
import { create_reply } from '../common_query.js';
const rand = promisify(randomInt);
const keys = [...name_table['ja'].keys()];

export const url = import.meta.url;
export const data = new SlashCommandBuilder()
	.setName('random')
	.setDescription('從OCG卡池隨機抽一張卡');
data.integration_types = [0, 1];
export async function execute(interaction) {
	const cid = keys[await rand(keys.length)];
	const card = get_card(cid);
	if (card) {
		await interaction.reply(create_reply(card, 'zh-tw'));
	}
	else {
		await interaction.reply('Error');
	}
}
