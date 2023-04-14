"use strict";
const MAX_CHOICE = 20;

module.exports = {
	async autocomplete(interaction, choice_table) {
		const focused = interaction.options.getFocused();
		if (!focused) {
			return;
		}

		const keyword = focused.toLowerCase();
		const starts_with = [];
		const other = [];
		for (const choice of Object.keys(choice_table)) {
			if (choice.toLowerCase().includes(keyword)) {
				if (choice.toLowerCase().startsWith(keyword))
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
