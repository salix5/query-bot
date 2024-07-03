import tc_json from './commands_data/choices_tc.json' with { type: 'json' };
import ruby_json from './commands_data/choices_ruby.json' with { type: 'json' };
const tc_entries = Object.entries(tc_json);
const ruby_entries = Object.entries(ruby_json);

export {
	tc_entries,
	ruby_entries,
}
