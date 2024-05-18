import { SlashCommandBuilder } from 'discord.js';
import { randomInt } from 'node:crypto';
import { promisify } from 'node:util';
const rand = promisify(randomInt);

export const url = import.meta.url;
export const data = new SlashCommandBuilder()
	.setName('dice')
	.setDescription('擲一個N面骰')
	.addIntegerOption(option => option.setName('face')
		.setDescription('面數')
		.setRequired(true)
		.setMinValue(2)
		.setMaxValue(0xffffffffffff)
	);
data.integration_types = [0, 1];
export async function execute(interaction) {
	const face = interaction.options.getInteger('face');
	if (face) {
		const result = await rand(face) + 1;
		await interaction.reply(result.toString());
	}
	else {
		await interaction.reply('Error');
	}
}
