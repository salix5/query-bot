import { SlashCommandBuilder } from 'discord.js';
import { randomInt } from 'node:crypto';
import { promisify } from 'node:util';
const rand = promisify(randomInt);

export const module_url = import.meta.url;
export const data = new SlashCommandBuilder()
	.setName('fortune')
	.setDescription('與命運嬉戲吧');
data.integration_types = [0, 1];
data.contexts = [0, 1, 2];
export async function execute(interaction) {
	const card = await rand(22);
  const position = await rand(2);
  let text = (card == 12) ? '顛倒，欺騙，完全相反！' : '';
  const result = `${card}，${position ? '正位' : '逆位'}\n${text}\n`;
	await interaction.reply(result);
}
