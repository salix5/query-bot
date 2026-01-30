/* eslint-disable no-unused-vars */
import { AutocompleteInteraction } from "discord.js";
import { create_choice_prerelease, create_choice_db, inverse_mapping } from "./ygo-query.mjs";
import { choices_ruby, name_to_id } from "./ygo-json-loader.mjs";

const MAX_CHOICE = 25;

export const choice_table = {
	__proto__: null,
	...name_to_id,
};
refresh_choice_table();

const jp_entries = half_width_entries(choice_table['ja']);
const name_jp = inverse_mapping(choice_table['ja']);

/**
 * @param {string} str
 * @returns
 */
function toHalfWidth(str) {
	return str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
}

/**
 * @param {string} str
 * @returns 
 */
function toFullWidth(str) {
	return str.replace(/[A-Za-z0-9]/g, (s) => String.fromCharCode(s.charCodeAt(0) + 0xFEE0));
}

function half_width_entries(choices) {
	const result = [];
	for (const [name, cid] of choices) {
		result.push([toHalfWidth(name), cid]);
	}
	return result;
}


export function refresh_choice_table() {
	const choices_tc = create_choice_db();
	choice_table['zh-tw'] = choices_tc;
	const choices_tc_full = new Map(choices_tc);
	const choices_pre = create_choice_prerelease();
	for (const [name, id] of choices_pre) {
		if (choices_tc.has(name)) {
			console.error('duplicate tc name', `${name}: ${id}`);
			continue;
		}
		choices_tc_full.set(name, id);
	}
	choice_table['full'] = choices_tc_full;
}

/**
 * @param {AutocompleteInteraction} interaction 
 * @param {[string, number][]} entries 
 * @returns id list
 */
function filter_choice(interaction, entries) {
	const focused = interaction.options.getFocused().trim();
	const starts_with = [];
	const other = [];
	const keyword = toHalfWidth(focused);
	for (const [choice, id] of entries) {
		if (choice.startsWith(keyword))
			starts_with.push(id);
		else if (choice.includes(keyword))
			other.push(id);
		if (starts_with.length >= MAX_CHOICE)
			return starts_with;
	}
	const ret = starts_with.concat(other);
	if (ret.length > MAX_CHOICE)
		ret.length = MAX_CHOICE;
	return ret;
}

/**
 * The autocomplete handler for Japanese card names, which also searches ruby.
 * @param {AutocompleteInteraction} interaction
 */
export async function autocomplete_jp(interaction) {
	const focused = interaction.options.getFocused().trim();
	if (!focused) {
		await interaction.respond([]);
		return;
	}
	const ret = filter_choice(interaction, jp_entries);
	if (ret.length < MAX_CHOICE) {
		const ruby_max_length = MAX_CHOICE - ret.length;
		const starts_with = [];
		const other = [];
		const id_set = new Set(ret);
		for (const [ruby, id] of choices_ruby) {
			if (id_set.has(id))
				continue;
			if (ruby.startsWith(focused))
				starts_with.push(id);
			else if (ruby.includes(focused))
				other.push(id);
			if (starts_with.length >= ruby_max_length)
				break;
		}
		ret.push(...starts_with);
		if (ret.length < MAX_CHOICE)
			ret.push(...other);
		if (ret.length > MAX_CHOICE)
			ret.length = MAX_CHOICE;
	}
	await interaction.respond(ret.map(id => {
		const card_name = name_jp.get(id);
		return { name: card_name, value: card_name };
	}));
}

/**
 * The default autocomplete handler.
 * @param {AutocompleteInteraction} interaction 
 * @param {string} request_locale 
 * @returns 
 */
export async function autocomplete_default(interaction, request_locale) {
	const focused = interaction.options.getFocused().trim();
	if (!focused || !choice_table[request_locale]) {
		await interaction.respond([]);
		return;
	}
	const starts_with = [];
	const other = [];
	const keyword = focused.toLowerCase();
	for (const [choice, _] of choice_table[request_locale]) {
		if (choice.toLowerCase().startsWith(keyword))
			starts_with.push(choice);
		else if (choice.toLowerCase().includes(keyword))
			other.push(choice);
		if (starts_with.length >= MAX_CHOICE)
			break;
	}
	let ret = null;
	if (starts_with.length >= MAX_CHOICE)
		ret = starts_with;
	else
		ret = starts_with.concat(other);
	if (ret.length > MAX_CHOICE)
		ret.length = MAX_CHOICE;
	await interaction.respond(
		ret.map(choice => ({ name: choice, value: choice }))
	);
}
