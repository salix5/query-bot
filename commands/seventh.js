import { SlashCommandBuilder } from 'discord.js';
import { autocomplete_default } from '../common_all.js';
import { query_command } from '../common_query.js';

export const module_url = import.meta.url;
export const data = new SlashCommandBuilder()
	.setName('seventh')
	.setDescription('搜尋「時空的七皇」使用的No.10X怪獸')
	.addStringOption(option => option.setName('input')
		.setDescription('卡名')
		.setRequired(true)
		.setMaxLength(50)
		.setAutocomplete(true)
	);
data.contexts = [0, 1, 2];
export async function autocomplete(interaction) {
	await autocomplete_default(interaction, 'full');
}
export async function execute(interaction) {
	await query_command(interaction, 'full', 'zh-tw');
}
