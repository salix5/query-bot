import { AutocompleteInteraction } from "discord.js";
const MAX_CHOICE = 25;

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
 * Create the inverse mapping of `obj`.
 * @param {Object} obj 
 * @returns {Object}
 */
export function inverse_mapping(obj) {
	const inverse = Object.create(null);
	for (const [key, value] of Object.entries(obj)) {
		if (inverse[value]) {
			console.log('non-invertible', `${key}: ${value}`);
			return Object.create(null);
		}
		inverse[value] = key;
	}
	return inverse;
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
export async function autocomplete(interaction, choice_table) {
	const focused = interaction.options.getFocused();
	const ret = filter_choice(focused, choice_table);
	await interaction.respond(
		ret.map(choice => ({ name: choice, value: choice })),
	);
}

/**
 * The handler of slash command autocomplete using `choice_table` and `choice_ruby` for Japanese card names.
 * @param {AutocompleteInteraction} interaction 
 * @param {Object} choice_table 
 * @param {Object} choice_ruby 
 * @param {Object} choice_inverse 
 */
export async function autocomplete_jp(interaction, choice_table, choice_ruby, choice_inverse) {
	const focused = interaction.options.getFocused();
	var ret = filter_choice(focused, choice_table, true);
	if (focused && ret.length < MAX_CHOICE) {
		const ruby_max_length = MAX_CHOICE - ret.length;
		const is_ready = Object.create(null);
		const starts_with = [];
		const other = [];

		for (const choice of ret) {
			is_ready[choice_table[choice]] = true;
		}
		const ruby_result = Object.entries(choice_ruby).filter(([ruby, id]) => !is_ready[id] && ruby.includes(focused));
		for (const [ruby, id] of ruby_result) {
			if (ruby.startsWith(focused))
				starts_with.push(choice_inverse[id]);
			else
				other.push(choice_inverse[id]);
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
