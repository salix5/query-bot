"use strict";
const { SlashCommandBuilder } = require('discord.js');
const { randomInt } = require('node:crypto');
const { promisify } = require('node:util');
const rand = promisify(randomInt);

module.exports = {
	data: new SlashCommandBuilder()
		.setName('dice')
		.setDescription('擲一個N面骰。')
		.addIntegerOption(option =>
			option.setName('face')
				.setDescription('面數')
				.setRequired(true)
				.setMinValue(2)
				.setMaxValue(0xffffffffffff)
	),
	async execute(interaction) {
		const face = interaction.options.getInteger('face');
		if (face) {
			const result = await rand(face) + 1;
			await interaction.reply(result.toString());
		}
		else {
			await interaction.reply('Error');
		}
	},
};
