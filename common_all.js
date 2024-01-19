import { AutocompleteInteraction } from "discord.js";
import { cid_inverse, create_choice, create_choice_prerelease, option_table } from "./ygo-query.mjs";
import name_to_cid from './commands_data/choices_tc.json' assert { type: 'json' };
import choice_ruby from './commands_data/choices_ruby.json' assert { type: 'json' };

const MAX_CHOICE = 25;

const choices_tc = Object.create(null);
for (const [name, cid] of Object.entries(name_to_cid)) {
	if (cid_inverse[cid])
		choices_tc[name] = cid_inverse[cid];
	else
		console.error('choices_tc', `${cid}: ${name}`);
}
const choices_tc_full = Object.assign(Object.create(null), choices_tc, create_choice_prerelease());

// option name -> id
const choice_table = Object.create(null);
choice_table['en'] = create_choice('en');
choice_table['ja'] = create_choice('ja');
choice_table['ko'] = create_choice('ko');
choice_table['tc'] = choices_tc;
choice_table['full'] = choices_tc_full;

const ruby_entries = Object.entries(choice_ruby);
const choice_entries = Object.create(null);
choice_entries['en'] = Object.entries(choice_table['en']);
choice_entries['ja'] = half_width_entries(choice_table['ja']);
choice_entries['ko'] = Object.entries(choice_table['ko']);
choice_entries['tc'] = Object.entries(choice_table['tc']);
choice_entries['full'] = Object.entries(choice_table['full']);

export { choice_table, choices_tc, choices_tc_full };

/**
 * toHalfWidth()
 * @param {string} str
 * @returns
 */
function toHalfWidth(str) {
	return str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
}

/**
 * toFullWidth()
 * @param {string} str
 * @returns 
 */
function toFullWidth(str) {
	return str.replace(/[A-Za-z0-9]/g, (s) => String.fromCharCode(s.charCodeAt(0) + 0xFEE0));
}

/**
 * Check if 2 strings are case-insensitive equal.
 * @param {string} a 
 * @param {string} b 
 * @returns boolean result
 */
function is_equal(a, b) {
	return toHalfWidth(a.toLowerCase()) === toHalfWidth(b.toLowerCase());
}

function half_width_entries(choices) {
	const result = [];
	for (const [name, id] of Object.entries(choices)) {
		result.push([toHalfWidth(name), id]);
	}
	return result;
}

/**
 * filter_choice()
 * @param {AutocompleteInteraction} interaction 
 * @param {[string, number][]} entries 
 * @returns id list
 */
function filter_choice(interaction, entries) {
	const focused = interaction.options.getFocused();
	const starts_with = [];
	const other = [];
	const keyword = toHalfWidth(focused).replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
	const start = new RegExp(`^${keyword}`);
	const include = new RegExp(`${keyword}`);
	for (const [choice, id] of entries) {
		if (start.test(choice))
			starts_with.push(id);
		else if (include.test(choice))
			other.push(id);
		if (starts_with.length >= MAX_CHOICE)
			return starts_with;
	}
	let ret = starts_with.concat(other);
	if (ret.length > MAX_CHOICE)
		ret.length = MAX_CHOICE;
	return ret;
}

/**
 * The autocomplete handler using `choice_ruby` for Japanese card names.
 * @param {AutocompleteInteraction} interaction
 */
export async function autocomplete_jp(interaction) {
	const focused = interaction.options.getFocused();
	if (!focused) {
		await interaction.respond([]);
		return;
	}
	let ret = filter_choice(interaction, choice_entries['ja']);
	if (ret.length < MAX_CHOICE) {
		const ruby_max_length = MAX_CHOICE - ret.length;
		const starts_with = [];
		const other = [];
		const id_set = new Set(ret);
		let keyword = focused.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
		const start = new RegExp(`^${keyword}`);
		const include = new RegExp(`${keyword}`);
		for (const [ruby, id] of ruby_entries) {
			if (id_set.has(id))
				continue;
			if (start.test(ruby))
				starts_with.push(id);
			else if (include.test(ruby))
				other.push(id);
			if (starts_with.length >= ruby_max_length)
				break;
		}
		ret = ret.concat(starts_with);
		if (ret.length < MAX_CHOICE)
			ret = ret.concat(other);
		if (ret.length > MAX_CHOICE)
			ret.length = MAX_CHOICE;
	}
	await interaction.respond(
		ret.map(id => ({ name: option_table['ja'][id], value: option_table['ja'][id] }))
	);
}

/**
 * The autocomplete handler for tc card names.
 * @param {AutocompleteInteraction} interaction 
 * @returns 
 */
export async function autocomplete_tc(interaction) {
	const focused = interaction.options.getFocused();
	if (!focused) {
		await interaction.respond([]);
		return;
	}
	const starts_with = [];
	const other = [];
	const keyword = focused.toLowerCase();
	const result = Object.keys(choices_tc).filter((choice) => choice.toLowerCase().includes(keyword));
	for (const choice of result) {
		if (choice.toLowerCase().startsWith(keyword))
			starts_with.push(choice);
		else
			other.push(choice);
		if (starts_with.length >= MAX_CHOICE)
			break;
	}
	let ret;
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

/**
 * The autocomplete handler for tc card names (including prerelease cards).
 * @param {AutocompleteInteraction} interaction 
 * @returns 
 */
export async function autocomplete_prerelease(interaction) {
	const focused = interaction.options.getFocused();
	if (!focused) {
		await interaction.respond([]);
		return;
	}
	const starts_with = [];
	const other = [];
	const keyword = focused.toLowerCase();
	const result = Object.keys(choices_tc_full).filter((choice) => choice.toLowerCase().includes(keyword));
	for (const choice of result) {
		if (choice.toLowerCase().startsWith(keyword))
			starts_with.push(choice);
		else
			other.push(choice);
		if (starts_with.length >= MAX_CHOICE)
			break;
	}
	let ret;
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

/**
 * The default autocomplete handler.
 * @param {AutocompleteInteraction} interaction 
 * @param {string} request_locale 
 * @returns 
 */
export async function autocomplete_default(interaction, request_locale) {
	const focused = interaction.options.getFocused();
	if (!focused || !choice_table[request_locale]) {
		await interaction.respond([]);
		return;
	}
	const starts_with = [];
	const other = [];
	let keyword = focused.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
	const start = new RegExp(`^${keyword}`, 'i');
	const include = new RegExp(`${keyword}`, 'i');
	for (const [choice, id] of choice_entries[request_locale]) {
		if (start.test(choice))
			starts_with.push(choice);
		else if (include.test(choice))
			other.push(choice);
		if (starts_with.length >= MAX_CHOICE)
			break;
	}
	let ret;
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
