import { SlashCommandBuilder } from 'discord.js';
import { autocomplete_default } from '../common_all.js';
import { query_command } from '../common_query.js';

export const module_url = import.meta.url;
export const data = new SlashCommandBuilder()
	.setName('card-en')
	.setDescription('以英文卡名搜尋卡片')
	.addStringOption(option => option.setName('input')
		.setDescription('卡名')
		.setRequired(true)
		.setMaxLength(100)
		.setAutocomplete(true)
	);
data.integration_types = [0, 1];
data.contexts = [0, 1, 2];
export async function autocomplete(interaction) {
	await autocomplete_default(interaction, 'en');
}
export async function execute(interaction) {
	await query_command(interaction, 'en', 'zh-tw');
}
