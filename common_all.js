import { AutocompleteInteraction } from "discord.js";
import { cid_inverse, create_choice, inverse_mapping } from "./ygo-query.mjs";
import choices_tc_temp from '../commands_data/choices_tc.json' assert { type: 'json' };

const choices_en = create_choice('en');
const choices_jp = create_choice('ja');
const choices_kr = create_choice('ko');
const MAX_CHOICE = 25;
const choices_jp_inverse = inverse_mapping(choices_jp);

const choices_tc = Object.create(null);
for (const [name, cid] of Object.entries(choices_tc_temp)) {
	if (cid_inverse[cid])
		choices_tc[name] = cid_inverse[cid];
	else
		console.error('choices_tc', `${cid}: ${name}`);
}
export { choices_en, choices_jp, choices_kr, choices_tc };

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



/**
 * Filter the choices matching `focused` in `choice_table` and push them into an array.
 * @param {string} focused 
 * @param {Object} choice_table 
 * @param {boolean} case_sensitive
 * @returns {string[]}
 */
export function filter_choice(focused, choice_table, case_sensitive = false) {
	if (!focused) {
		return [];
	}

	const starts_with = [];
	const other = [];
	const keyword = toHalfWidth(case_sensitive ? focused : focused.toLowerCase());
	const filter_function = case_sensitive ? (choice => toHalfWidth(choice).includes(keyword)) : (choice => toHalfWidth(choice.toLowerCase()).includes(keyword));
	const result = Object.keys(choice_table).filter(filter_function);
	for (const choice of result) {
		let card_name = toHalfWidth(case_sensitive ? choice : choice.toLowerCase());
		if (card_name.startsWith(keyword))
			starts_with.push(choice);
		else
			other.push(choice);
		if (starts_with.length == MAX_CHOICE)
			return starts_with;
	}
	const ret = starts_with.concat(other);
	if (ret.length > MAX_CHOICE)
		ret.length = MAX_CHOICE;
	return ret;
}

/**
 * The handler of slash command autocomplete using `choice_table`.
 * @param {AutocompleteInteraction} interaction 
 * @param {Object} choice_table
 */
export async function autocomplete_default(interaction, choice_table) {
	const focused = interaction.options.getFocused();
	const ret = filter_choice(focused, choice_table);
	await interaction.respond(
		ret.map(choice => ({ name: choice, value: choice })),
	);
}

/**
 * The handler of slash command autocomplete using `choice_ruby` for Japanese card names.
 * @param {AutocompleteInteraction} interaction 
 * @param {Object} choice_ruby 
 */
export async function autocomplete_jp(interaction, choice_ruby) {
	const focused = interaction.options.getFocused();
	var ret = filter_choice(focused, choices_jp, true);
	if (focused && ret.length < MAX_CHOICE) {
		const ruby_max_length = MAX_CHOICE - ret.length;
		const is_ready = Object.create(null);
		const starts_with = [];
		const other = [];

		for (const choice of ret) {
			is_ready[choices_jp[choice]] = true;
		}
		const ruby_result = Object.entries(choice_ruby).filter(([ruby, id]) => !is_ready[id] && ruby.includes(focused));
		for (const [ruby, id] of ruby_result) {
			if (ruby.startsWith(focused))
				starts_with.push(choices_jp_inverse[id]);
			else
				other.push(choices_jp_inverse[id]);
			if (starts_with.length >= ruby_max_length)
				break;
		}
		const ruby_ret = starts_with.concat(other);
		if (ruby_ret.length > ruby_max_length)
			ruby_ret.length = ruby_max_length;
		ret = ret.concat(ruby_ret);
	}
	await interaction.respond(
		ret.map(choice => ({ name: choice, value: choice })),
	);
}
