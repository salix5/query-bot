import { SlashCommandBuilder } from 'discord.js';
import { choice_table } from '../common_all.js';
import { query_command } from '../common_query.js';

export const data = new SlashCommandBuilder()
	.setName('ocg-jp')
	.setDescription('カードを検索します。')
	.addStringOption(option => option.setName('input')
		.setDescription('カード名')
		.setRequired(true)
		.setMaxLength(50)
		.setAutocomplete(true)
	);
export const cooldown = 2;
export { autocomplete_jp as autocomplete } from '../common_all.js';
export async function execute(interaction) {
	const input = interaction.options.getString('input');
	const id = choice_table['ja'][input];
	await query_command(interaction, id, 'ja');
}
