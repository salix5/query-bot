import { SlashCommandBuilder } from 'discord.js';
import { name_table, get_card, cid_table } from '../ygo-query.mjs';
import { random_integer } from '../ygo-utility.mjs';
import { create_reply } from '../common_query.js';
const cid_list_ja = Object.keys(name_table['ja']).map(key => Number.parseInt(key, 10));

export const module_url = import.meta.url;
export const data = new SlashCommandBuilder()
	.setName('random')
	.setDescription('從OCG卡池隨機抽一張卡');
data.integration_types = [0, 1];
data.contexts = [0, 1, 2];
export async function execute(interaction) {
	const cid = cid_list_ja[await random_integer(cid_list_ja.length)];
	const card = get_card(cid_table.get(cid));
	if (card) {
		await interaction.reply(create_reply(card, 'zh-tw'));
	}
	else {
		await interaction.reply('Error');
	}
}
