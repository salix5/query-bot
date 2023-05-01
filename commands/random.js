"use strict";
const { randomInt } = require('node:crypto');
const { promisify } = require('node:util');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');
const ygo = require('../ygo-query.js');
const ocg_table = require('../data/choices_tc.json');
const rand = promisify(randomInt);

module.exports = {
	data: new SlashCommandBuilder()
		.setName('random')
		.setDescription('從OCG卡池隨機抽一張卡'),
	async execute(interaction) {
		const id_list = Object.values(ocg_table);
		const id = id_list[await rand(id_list.length)];
		const result = [];
		ygo.query_id(id, result);
		if (result.length === 1) {
			const card = result[0];
			const button1 = new ButtonBuilder()
				.setStyle(ButtonStyle.Link)
				.setLabel('DB')
				.setURL(ygo.print_db_link(card.cid, card.ot));
			const button2 = new ButtonBuilder()
				.setStyle(ButtonStyle.Link)
				.setLabel('Q&A')
				.setURL(ygo.print_qa_link(card.cid));
			const row1 = new ActionRowBuilder()
				.addComponents(button1)
				.addComponents(button2);
			await interaction.reply({ content: ygo.print_data(card), components: [row1] });
		}
		else {
			await interaction.reply('Error');
		}
	},
};
