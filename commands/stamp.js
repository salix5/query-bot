import { SlashCommandBuilder } from 'discord.js';

export const module_url = import.meta.url;
export const data = new SlashCommandBuilder()
	.setName('stamp')
	.setDescription('發送貼圖');
data.integration_types = [0, 1];
data.contexts = [0, 1, 2];
const stickerId = '1051036645866098719';

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction 
 */
export async function execute(interaction) {
	await interaction.reply({ content: '已發送貼圖！', ephemeral: true });
	try {
		await interaction.channel.send({
			stickers: [stickerId]
		});
	}
	catch { 
		console.error('Failed to send sticker in:', interaction.channel.name);
	}
}
