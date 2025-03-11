import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { autocomplete_default, choice_table } from '../common_all.js';
import { cid_table, print_history_link } from '../ygo-query.mjs';

export const module_url = import.meta.url;
export const data = new SlashCommandBuilder()
	.setName('link')
	.setDescription('裁定相關連結')
	.addStringOption(option => option.setName('input')
		.setDescription('卡名')
		.setRequired(true)
		.setMaxLength(50)
		.setAutocomplete(true)
	);
data.integration_types = [0, 1];
data.contexts = [0, 1, 2];
export async function autocomplete(interaction) {
	await autocomplete_default(interaction, 'zh-tw');
}
export async function execute(interaction) {
	const input = interaction.options.getString('input');
	const cid = choice_table['zh-tw'].get(input);
	if (cid) {
		const id = cid_table.get(cid);
		const row1 = new ActionRowBuilder();
		const button1 = new ButtonBuilder()
			.setStyle(ButtonStyle.Link)
			.setURL(`https://ygocdb.com/card/${id}`)
			.setLabel('百鴿');
		row1.addComponents(button1);
		const button2 = new ButtonBuilder()
			.setStyle(ButtonStyle.Link)
			.setURL(`${print_history_link(cid)}`)
			.setLabel('DB歷史');
		row1.addComponents(button2);
		await interaction.reply({ content: '', components: [row1] });
	}
	else {
		await interaction.reply('沒有符合條件的卡片。');
	}
}
