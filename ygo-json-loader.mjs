import ltable_ocg from './data/lflist.json' with { type: 'json' };
import ltable_tcg from './data/lflist_tcg.json' with { type: 'json' };
import ltable_md from './data/lflist_md.json' with { type: 'json' };
import md_card_list from './data/CardList.json' with { type: 'json' };
import setname_table from './data/setname.json' with { type: 'json' };
import pack_table from './pack/pack_list.json' with { type: 'json' };
import pre_table from './pack/pre_release.json' with { type: 'json' };
import wiki_table from './pack/wiki_link.json' with { type: 'json' };
import genesys_point from './data/genesys_point.json' with { type: 'json' };

import cid_json from './data/cid_table.json' with { type: 'json' };
import ae_table from './data/name_table_ae.json' with { type: 'json' };
import en_table from './data/name_table_en.json' with { type: 'json' };
import jp_table from './data/name_table_jp.json' with { type: 'json' };
import kr_table from './data/name_table_kr.json' with { type: 'json' };
import md_en_table from './data/md_name_en.json' with { type: 'json' };
import md_jp_table from './data/md_name_jp.json' with { type: 'json' };
import md_table_sc from './data/md_name.json' with { type: 'json' };
import ruby_table from './data/name_table_ruby.json' with { type: 'json' };
import extra_setcodes from './data/extra_setcodes.json' with { type: 'json' };

import lang_ae from './lang/ae.json' with { type: 'json' };
import lang_en from './lang/en.json' with { type: 'json' };
import lang_ja from './lang/ja.json' with { type: 'json' };
import lang_ko from './lang/ko.json' with { type: 'json' };
import lang_zhtw from './lang/zh-tw.json' with { type: 'json' };
import { inverse_mapping, inverse_table } from './ygo-utility.mjs';
import { CID_BLACK_LUSTER_SOLDIER, CID_RITUAL_BLS, MAX_CARD_ID } from './ygo-constant.mjs';

/**
 * @param {object} obj 
 * @returns {Map<number, any>}
 */
function object_to_map(obj) {
	const result = new Map();
	for (const [prop, value] of Object.entries(obj)) {
		const key = Number.parseInt(prop, 10);
		if (!Number.isSafeInteger(key)) {
			console.error('object_to_map: invalid key', prop);
			continue;
		}
		result.set(key, value);
	}
	return result;
}

export const cid_table = object_to_map(cid_json);

export const name_table = Object.create(null);
name_table['ae'] = ae_table;
name_table['en'] = en_table;
name_table['ja'] = jp_table;
name_table['ko'] = kr_table;

export const md_table = Object.create(null);
md_table['en'] = md_en_table;
md_table['ja'] = md_jp_table;

export const pack_list = new Map(Object.entries(pack_table));
export const pre_release = new Map(Object.entries(pre_table));
export const wiki_link = new Map(Object.entries(wiki_table));
export const id_to_cid = inverse_mapping(cid_table);
const pack_id_table = inverse_mapping(pre_release);

export const official_name = {
	__proto__: null,
	'ae': 'ae_name',
	'en': 'en_name',
	'ja': 'jp_name',
	'ko': 'kr_name',
};

export const lang = {
	__proto__: null,
	'ae': lang_ae,
	'en': lang_en,
	'ja': lang_ja,
	'ko': lang_ko,
	'zh-tw': lang_zhtw,
};

export const collator_locale = {
	__proto__: null,
	'ae': 'en-US',
	'en': 'en-US',
	'ja': 'ja-JP',
	'ko': 'ko-KR',
	'zh-tw': 'zh-Hant',
};

export const bls_postfix = {
	__proto__: null,
	'ae': ' (Normal)',
	'en': ' (Normal)',
	'ja': '（通常モンスター）',
	'ko': ' (일반)',
	'zh-tw': '（通常怪獸）',
};

export const game_name = {
	__proto__: null,
	'en': 'md_name_en',
	'ja': 'md_name_jp',
};

export const complete_name_table = Object.create(null);
for (const locale of Object.keys(official_name)) {
	if (!md_table[locale] && !name_table[locale][CID_BLACK_LUSTER_SOLDIER]) {
		complete_name_table[locale] = name_table[locale];
		continue;
	}
	const table1 = Object.assign({}, name_table[locale]);
	let valid = true;
	if (md_table[locale]) {
		for (const [cid, name] of Object.entries(md_table[locale])) {
			if (table1[cid]) {
				console.error(`duplicate cid: md_table[${locale}]`, cid);
				valid = false;
				break;
			}
			table1[cid] = name;
		}
		if (!valid) {
			complete_name_table[locale] = {};
			continue;
		}
	}
	if (table1[CID_BLACK_LUSTER_SOLDIER]) {
		const bls_name = `${table1[CID_BLACK_LUSTER_SOLDIER]}${bls_postfix[locale]}`;
		table1[CID_BLACK_LUSTER_SOLDIER] = bls_name;
	}
	complete_name_table[locale] = table1;
}

/**
 * Create the [name, id] table of region `request_locale`
 * @param {string} request_locale 
 * @returns {Map<string, number>}
 */
function create_choice(request_locale) {
	if (!complete_name_table[request_locale])
		return new Map();
	const inverse = inverse_table(complete_name_table[request_locale]);
	const collator = new Intl.Collator(collator_locale[request_locale]);
	const entries = [...inverse].sort((a, b) => collator.compare(a[0], b[0]));
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
	const convert_map1 = object_to_map(ruby_table);
	convert_map1.delete(CID_BLACK_LUSTER_SOLDIER);
	const jp_collator = new Intl.Collator('ja-JP');
	const ruby_entries = [...inverse_mapping(convert_map1)].sort((a, b) => jp_collator.compare(jp_table[a[1]], jp_table[b[1]]));
	for (const entry of ruby_entries) {
		entry[1] = cid_table.get(entry[1]);
	}
	return new Map(ruby_entries);
}

export const choices_ruby = create_ruby_choice();

/**
 * Get the pack name for pre-release id.
 * @param {number} id
 * @returns {string}
 */
export function get_pack_name(id) {
	if (id <= MAX_CARD_ID)
		return '';
	const pack_id = id - id % 1000;
	const pack_name = pack_id_table.get(pack_id);
	if (!pack_name)
		return '';
	if (pack_name.charAt(0) === '_')
		return pack_name.substring(1);
	return pack_name;
}

/**
 * Get the card name of `id` in the region `locale`.
 * @param {number} cid 
 * @param {string} locale 
 * @returns {string}
 */
export function get_name(cid, locale) {
	if (!complete_name_table[locale]?.[cid])
		return '';
	if (cid === CID_BLACK_LUSTER_SOLDIER && complete_name_table[locale][CID_RITUAL_BLS])
		return complete_name_table[locale][CID_RITUAL_BLS];
	return complete_name_table[locale][cid];
}

/**
 * Add complete_name_table to the database `db`.
 * @param {DatabaseSync} db 
 */
export function load_name_table(db) {
	const table_name = 'card_names';
	db.exec(`DROP TABLE IF EXISTS ${table_name};`);
	db.exec(`CREATE TABLE ${table_name} ("id" INTEGER PRIMARY KEY, "en_name" TEXT, "jp_name" TEXT, "jp_ruby" TEXT);`);
	const insert_name = db.prepare(`INSERT INTO ${table_name} VALUES (?, ?, ?, ?);`);
	try {
		db.exec(`BEGIN TRANSACTION;`);
		for (const cid of cid_table.keys()) {
			const id = cid_table.get(cid);
			const en_name = complete_name_table['en'][cid] ?? '';
			const jp_name = complete_name_table['ja'][cid] ?? '';
			const jp_ruby = ruby_table[cid] ?? '';
			insert_name.run(id, en_name, jp_name, jp_ruby);
		}
		const fix_name = db.prepare(`UPDATE ${table_name} SET en_name = ?, jp_name = ?, jp_ruby = ? WHERE id = ?;`);
		const bls_name_en = complete_name_table['en'][CID_RITUAL_BLS] ?? '';
		const bls_name_jp = complete_name_table['ja'][CID_RITUAL_BLS] ?? '';
		const bls_name_ruby = ruby_table[CID_RITUAL_BLS] ?? '';
		const bls_id = cid_table.get(CID_BLACK_LUSTER_SOLDIER);
		fix_name.run(bls_name_en, bls_name_jp, bls_name_ruby, bls_id);
		db.exec(`COMMIT;`);
	}
	catch (error) {
		db.exec(`ROLLBACK;`);
		console.error('Failed to load card_names table:', error);
	}
}

export {
	ltable_ocg, ltable_tcg, ltable_md,
	md_card_list,
	setname_table,
	genesys_point,
	jp_table,
	md_table_sc,
	extra_setcodes,
	ruby_table,
}
