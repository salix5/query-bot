"use strict";
const { randomInt } = require('node:crypto');
const { promisify } = require('node:util');
const { SlashCommandBuilder } = require('discord.js');
const ygo = require('../ygo-query.js');
const { create_reply } = require('../common_query.js');
const ocg_list = require('../data/ocg_list.json');
const rand = promisify(randomInt);

module.exports = {
	data: new SlashCommandBuilder()
		.setName('random')
		.setDescription('從OCG卡池隨機抽一張卡'),
	async execute(interaction) {
		const id = ocg_list[await rand(ocg_list.length)];
		const card = ygo.get_card(id);
		if (card) {
			await interaction.reply(create_reply(card, 'zh-tw'));
		}
		else {
			await interaction.reply('Error');
		}
	},
};
