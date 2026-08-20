import md_card_list from './data/md_card_list.json' with { type: 'json' };
import pre_release from './pack/pre_release.json' with { type: 'json' };

import cid_json from './data/cid_table.json' with { type: 'json' };
import en_table from './data/name_table_en.json' with { type: 'json' };
import jp_table from './data/name_table_jp.json' with { type: 'json' };
import kr_table from './data/name_table_kr.json' with { type: 'json' };
import md_en_table from './data/md_name_en.json' with { type: 'json' };
import md_jp_table from './data/md_name_jp.json' with { type: 'json' };
import ruby_table from './data/name_table_ruby.json' with { type: 'json' };

import lang_en from './lang/en.json' with { type: 'json' };
import lang_ja from './lang/ja.json' with { type: 'json' };
import lang_ko from './lang/ko.json' with { type: 'json' };
import lang_zhtw from './lang/zh-tw.json' with { type: 'json' };
import { inverse_mapping, inverse_table } from './ygo-utility.mjs';
import { CID_BLACK_LUSTER_SOLDIER } from './ygo-constant.mjs';

/**
 * @param {object} obj 
 * @returns {Map<number, any>}
 */
function object_to_map(obj) {
	const result = new Map();
	for (const key of Object.keys(obj)) {
		result.set(Number(key), obj[key]);
	}
	return result;
}

/**
 * @type {Map<number, number>}
 */
export const cid_table = object_to_map(cid_json);

export const name_table = {
	__proto__: null,
	'en': en_table,
	'ja': jp_table,
	'ko': kr_table,
};

export const md_table = {
	__proto__: null,
	'en': md_en_table,
	'ja': md_jp_table,
};

/**
 * @type {Map<number, number>}
 */
export const id_to_cid = inverse_mapping(cid_table);
const pack_id_table = Object.fromEntries(Object.entries(pre_release).map(([k, v]) => [v, k]));

export const official_name = {
	__proto__: null,
	'en': 'en_name',
	'ja': 'jp_name',
	'ko': 'kr_name',
};

export const game_name = {
	__proto__: null,
	'en': 'md_name_en',
	'ja': 'md_name_jp',
};

export const language_pack = {
	__proto__: null,
	'en': {
		strings: lang_en,
		collator: 'en-US',
		bls_postfix: ' (Normal)',
	},
	'ja': {
		strings: lang_ja,
		collator: 'ja-JP',
		bls_postfix: '（通常モンスター）',
	},
	'ko': {
		strings: lang_ko,
		collator: 'ko-KR',
		bls_postfix: ' (일반)',
	},
	'zh-tw': {
		strings: lang_zhtw,
		collator: 'zh-Hant',
		bls_postfix: '（通常怪獸）',
	},
};

/**
 * Create the [name, id] table of region `request_locale`
 * @param {string} request_locale 
 * @returns {Map<string, number>}
 */
function create_choice(request_locale) {
	if (!name_table[request_locale]) {
		return new Map();
	}
	const complete_name_table = object_to_map(name_table[request_locale]);
	if (md_table[request_locale]) {
		for (const key of Object.keys(md_table[request_locale])) {
			complete_name_table.set(Number(key), md_table[request_locale][key]);
		}
	}
	if (complete_name_table.has(CID_BLACK_LUSTER_SOLDIER)) {
		const bls_name = `${complete_name_table.get(CID_BLACK_LUSTER_SOLDIER)}${language_pack[request_locale].bls_postfix}`;
		complete_name_table.set(CID_BLACK_LUSTER_SOLDIER, bls_name);
	}
	const collator = new Intl.Collator(language_pack[request_locale].collator);
	const entries = [...inverse_mapping(complete_name_table)].sort((a, b) => collator.compare(a[0], b[0]));
	for (const entry of entries) {
		entry[1] = cid_table.get(entry[1]);
	}
	return new Map(entries);
}

export const name_to_id = Object.create(null);
for (const locale of Object.keys(official_name)) {
	name_to_id[locale] = create_choice(locale);
}

function create_ruby_choice() {
	const obj1 = {};
	Object.assign(obj1, ruby_table);
	delete obj1[CID_BLACK_LUSTER_SOLDIER];
	const jp_collator = new Intl.Collator('ja-JP');
	const ruby_entries = [...inverse_table(obj1)].sort((a, b) => jp_collator.compare(jp_table[a[1]], jp_table[b[1]]));
	for (const entry of ruby_entries) {
		entry[1] = cid_table.get(entry[1]);
	}
	return new Map(ruby_entries);
}

export const choices_ruby = create_ruby_choice();

/**
 * Get the pack name for pre-release id.
 * @param {number} id
 * @returns {string?}
 */
export function get_pack_name(id) {
	if (!Number.isSafeInteger(id))
		return null;
	const pack_id = id - id % 1000;
	const pack_name = pack_id_table[pack_id];
	return pack_name?.substring(0, 4) ?? null;
}

/**
 * Get the card name of `id` in the region `locale`.
 * @param {number} cid 
 * @param {string} locale 
 * @returns {string}
 */
export function get_name(cid, locale) {
	if (name_table[locale] && Object.hasOwn(name_table[locale], cid))
		return name_table[locale][cid];
	if (md_table[locale] && Object.hasOwn(md_table[locale], cid))
		return md_table[locale][cid];
	return '';
}

const extension_schema = `CREATE TABLE extension (
    id INTEGER PRIMARY KEY,
    cid INTEGER NOT NULL,
    en_name TEXT NOT NULL,
    jp_name TEXT NOT NULL,
    jp_ruby TEXT NOT NULL,
    md_name_en TEXT NOT NULL,
    md_name_jp TEXT NOT NULL,
    md_rarity INTEGER NOT NULL
) STRICT;`;
/**
 * Add cid, language-specific names, md_rarity to the database `db`.
 * @param {DatabaseSync} db 
 */
export function load_name_table(db) {
	db.exec(`DROP TABLE IF EXISTS extension;`);
	db.exec(extension_schema);
	const insert_name = db.prepare(`INSERT INTO extension (id, cid, en_name, jp_name, jp_ruby, md_name_en, md_name_jp, md_rarity) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`);
	try {
		db.exec(`BEGIN TRANSACTION;`);
		for (const cid of cid_table.keys()) {
			const id = cid_table.get(cid);
			const en_name = name_table['en'][cid] ?? '';
			const jp_name = name_table['ja'][cid] ?? '';
			const jp_ruby = ruby_table[cid] ?? '';
			const md_name_en = md_table['en'][cid] ?? '';
			const md_name_jp = md_table['ja'][cid] ?? '';
			const rarity = md_card_list[cid] ?? 0;
			insert_name.run(id, cid, en_name, jp_name, jp_ruby, md_name_en, md_name_jp, rarity);
		}
		db.exec(`COMMIT;`);
	}
	catch (error) {
		db.exec(`ROLLBACK;`);
		console.error('Failed to load extension table:', error);
	}
}

export { default as ltable_ocg } from './data/lflist.json' with { type: 'json' };
export { default as ltable_tcg } from './data/lflist_tcg.json' with { type: 'json' };
export { default as ltable_md } from './data/lflist_md.json' with { type: 'json' };
export { default as setname_table } from './data/setname.json' with { type: 'json' };
export { default as pack_list } from './pack/pack_list.json' with { type: 'json' };
export { default as genesys_point } from './data/genesys_point.json' with { type: 'json' };
export { default as extra_setcodes } from './data/extra_setcodes.json' with { type: 'json' };

export {
	md_card_list,
	ruby_table,
	pre_release,
};
