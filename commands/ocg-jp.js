import { SlashCommandBuilder } from 'discord.js';
import { query_command } from '../common_query.js';

export const module_url = import.meta.url;
export const data = new SlashCommandBuilder()
	.setName('ocg-jp')
	.setDescription('カードを検索します。')
	.addStringOption(option => option.setName('input')
		.setDescription('カード名')
		.setRequired(true)
		.setMaxLength(50)
		.setAutocomplete(true)
	);
data.integration_types = [0, 1];
data.contexts = [0, 1, 2];
export const cooldown = 2;
export { autocomplete_jp as autocomplete } from '../common_all.js';
export async function execute(interaction) {
	await query_command(interaction, 'ja', 'ja');
}
