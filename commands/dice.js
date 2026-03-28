import { SlashCommandBuilder } from 'discord.js';
import { random_integer } from '../ygo-utility.mjs';

export const module_url = import.meta.url;
export const data = new SlashCommandBuilder()
	.setName('dice')
	.setDescription('擲一個N面骰（預設值為20）')
	.addIntegerOption(option => option.setName('face')
		.setDescription('面數')
		.setRequired(false)
		.setMinValue(2)
		.setMaxValue(0xffffffffffff)
	);
data.integration_types = [0, 1];
data.contexts = [0, 1, 2];
export async function execute(interaction) {
	let face = interaction.options.getInteger('face');
	if (!face)
		face = 20;
	const result = await random_integer(face) + 1;
	await interaction.reply(`${result}`);
}
