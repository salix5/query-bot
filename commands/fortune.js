import { SlashCommandBuilder } from 'discord.js';
import { randomInt } from 'node:crypto';
import { promisify } from 'node:util';
const rand = promisify(randomInt);

const major_arcana = {
	0: '0 愚者',
	1: 'I 魔術師',
	2: 'II 女祭司',
	3: 'III 女帝',
	4: 'IV 皇帝',
	5: 'V 教皇',
	6: 'VI 戀人',
	7: 'VII 戰車',
	8: 'VIII 力量',
	9: 'IX 隱者',
	10: 'X 命運之輪',
	11: 'XI 正義',
	12: 'XII 倒吊人',
	13: 'XIII 死神',
	14: 'XIV 節制',
	15: 'XV 惡魔',
	16: 'XVI 高塔',
	17: 'XVII 星星',
	18: 'XVIII 月亮',
	19: 'XIX 太陽',
	20: 'XX 審判',
	21: 'XXI 世界',
};

const msg = {
	120: '顛倒，欺騙，完全相反！\n世間一切都不過是瑣事！有你的《自我滿足》就好！ ',
	121: '我是《倒吊人》！掌管《自我犧牲》！\n顛倒，欺騙，完全相反！',
};

export const module_url = import.meta.url;
export const data = new SlashCommandBuilder()
	.setName('fortune')
	.setDescription('與命運嬉戲吧');
data.integration_types = [0, 1];
data.contexts = [0, 1, 2];
export async function execute(interaction) {
	const card = await rand(22);
	const position = await rand(2);
	const msg_id = card * 10 + position;
	const text = msg[msg_id] ? msg[msg_id] : '';
	const result = `${major_arcana[card]}，${position ? '正位' : '逆位'}\n${text}\n`;
	await interaction.reply(result);
}
