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
 * is_equal() - Check if 2 strings are case-insensitive equal.
 * @param {string} a 
 * @param {string} b 
 * @returns boolean result
 */
function is_equal(a, b) {
	return toHalfWidth(a.toLowerCase()) === toHalfWidth(b.toLowerCase());
}

/**
 * inverse_mapping()
 * @param {object} obj 
 * @returns 
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
 * filter_choice() - Filter the choice table and push them into an array.
 * @param {string} focused 
 * @param {object} choice_table 
 * @returns choice array
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
 * autocomplete() - autocomplete interaction handler
 * @param {AutocompleteInteraction} interaction 
 * @param {object} choice_table
 */
async function autocomplete(interaction, choice_table) {
	const focused = interaction.options.getFocused();
	const ret = filter_choice(focused, choice_table);
	await interaction.respond(
		ret.map(choice => ({ name: choice, value: choice })),
	);
}

module.exports = {
	MAX_CHOICE,

	filter_choice,
	autocomplete,
};
