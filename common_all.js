"use strict";
const MAX_CHOICE = 25;

module.exports = {
	async autocomplete(interaction, choice_table) {
		const focused = interaction.options.getFocused();
		if (!focused || typeof focused !== 'string') {
			await interaction.respond([]);
			return;
		}

		const keyword = focused.toHalfWidth().toLowerCase();
		const starts_with = [];
		const other = [];
		for (const choice of Object.keys(choice_table)) {
			let card_name = choice.toHalfWidth().toLowerCase();
			if (card_name.includes(keyword)) {
				if (card_name.startsWith(keyword))
					starts_with.push(choice);
				else
					other.push(choice);
			}
		}
		const ret = starts_with.concat(other);
		if (ret.length > MAX_CHOICE)
			ret.length = MAX_CHOICE;
		await interaction.respond(
			ret.map(choice => ({ name: choice, value: choice })),
		);
	},
};
