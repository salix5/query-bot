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
 * compare_card() - Generate the compare function of cards.
 * @param {string} name query name
 * @returns compare function
 */
function compare_card(name) {
	return function (a, b) {
		if (is_equal(a.name, name)) {
			return -1;
		}
		else if (is_equal(b.name, name)) {
			return 1;
		}
		else if (a.jp_name && is_equal(a.jp_name, name)) {
			return -1;
		}
		else if (b.jp_name && is_equal(b.jp_name, name)) {
			return 1;
		}

		if (a.color !== b.color) {
			return a.color - b.color;
		}
		else if (a.level !== b.level) {
			return b.level - a.level;
		}
		else {
			return a.name.localeCompare(b.name, 'zh-Hant');
		}
	}
}

/**
 * filter_choice() - Filter the choice table and push them into an array.
 * @param {AutocompleteInteraction} interaction 
 * @param {Object} choice_table 
 * @returns choice array
 */
function filter_choice(interaction, choice_table) {
	const focused = interaction.options.getFocused();
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

module.exports = {
	MAX_CHOICE: MAX_CHOICE,

	filter_choice: filter_choice,

	async autocomplete(interaction, choice_table) {
		const ret = filter_choice(interaction, choice_table);
		await interaction.respond(
			ret.map(choice => ({ name: choice, value: choice })),
		);
	},
};
