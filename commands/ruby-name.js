import { SlashCommandBuilder } from 'discord.js';
import { get_name, id_to_cid } from '../ygo-json-loader.mjs';
import { choice_table } from '../common_all.js';
import { reply_text } from '../common_query.js';

export const module_url = import.meta.url;
export const data = new SlashCommandBuilder()
	.setName('ruby-name')
	.setDescription('カードを検索します。')
	.addStringOption(option => option.setName('input')
		.setDescription('カード名')
		.setRequired(true)
		.setMaxLength(50)
		.setAutocomplete(true)
	);
data.integration_types = [0, 1];
data.contexts = [0, 1, 2];
export { autocomplete_jp as autocomplete } from '../common_all.js';
export async function execute(interaction) {
	const input = interaction.options.getString('input');
	const cid = id_to_cid.get(choice_table['ja'].get(input));
	const jp_name = cid ? get_name(cid, 'ja') : '';
	if (jp_name) {
		await interaction.reply(jp_name);
	}
	else {
		await interaction.reply(reply_text['ja'].none);
	}
}
