import { SlashCommandBuilder } from 'discord.js';
import { query_command } from '../common_query.js';

export const data = new SlashCommandBuilder()
	.setName('card-jp')
	.setDescription('以日文卡名搜尋卡片')
	.addStringOption(option => option.setName('input')
		.setDescription('卡名')
		.setRequired(true)
		.setMaxLength(50)
		.setAutocomplete(true)
	);
export { autocomplete_jp as autocomplete } from '../common_all.js';
export async function execute(interaction) {
	await query_command(interaction, 'ja', 'zh-tw');
}
