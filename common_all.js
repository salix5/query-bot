"use strict";
const { AutocompleteInteraction } = require("discord.js");
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
function inverse_mapping(obj) {
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
 * Filter the choice matching `focused` in `choice_table` and push them into an array.
 * @param {string} focused 
 * @param {Object} choice_table 
 * @returns {Object[]}
 */
function filter_choice(focused, choice_table) {
	if (!focused) {
		return [];
	}

	const keyword = toHalfWidth(focused.toLowerCase());
	const starts_with = [];
	const other = [];
	const result = Object.keys(choice_table).filter((choice) => toHalfWidth(choice.toLowerCase()).includes(keyword));
	for (const choice of result) {
		let card_name = toHalfWidth(choice.toLowerCase());
		if (card_name.startsWith(keyword))
			starts_with.push(choice);
		else
			other.push(choice);
		if (starts_with.length >= MAX_CHOICE)
			break;
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
async function autocomplete(interaction, choice_table) {
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
async function autocomplete_jp(interaction, choice_table, choice_ruby, choice_inverse) {
	const focused = interaction.options.getFocused();
	var ret = filter_choice(focused, choice_table);
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

module.exports = {
	MAX_CHOICE,

	inverse_mapping,
	filter_choice,
	autocomplete,
	autocomplete_jp,
};
