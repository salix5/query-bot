"use strict";
const MAX_CHOICE = 25;

module.exports = {
	filter_choice(interaction, choice_table) {
		const focused = interaction.options.getFocused();
		if (!focused || typeof focused !== 'string') {
			return [];
		}

		const keyword = focused.toHalfWidth().toLowerCase();
		const starts_with = [];
		const other = [];
		const result = Object.keys(choice_table).filter((choice) => choice.toHalfWidth().toLowerCase().includes(keyword));
		for (const choice of result) {
			let card_name = choice.toHalfWidth().toLowerCase();
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
	},
	
	async autocomplete(interaction, choice_table) {
		const ret = this.filter_choice(interaction, choice_table);
		await interaction.respond(
			ret.map(choice => ({ name: choice, value: choice })),
		);
	},
};
