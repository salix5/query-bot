import ltable_ocg from './data/lflist.json' with { type: 'json' };
import ltable_tcg from './data/lflist_tcg.json' with { type: 'json' };
import ltable_md from './data/lflist_md.json' with { type: 'json' };
import md_card_list from './data/CardList.json' with { type: 'json' };

import cid_json from './data/cid_table.json' with { type: 'json' };
import ae_table from './data/name_table_ae.json' with { type: 'json' };
import en_table from './data/name_table_en.json' with { type: 'json' };
import jp_table from './data/name_table_jp.json' with { type: 'json' };
import kr_table from './data/name_table_kr.json' with { type: 'json' };
import md_en_table from './data/md_name_en.json' with { type: 'json' };
import md_jp_table from './data/md_name_jp.json' with { type: 'json' };
import md_sc from './data/md_name.json' with { type: 'json' };
import ruby_table from './data/name_table_ruby.json' with { type: 'json' };

import lang_ae from './lang/ae.json' with { type: 'json' };
import lang_en from './lang/en.json' with { type: 'json' };
import lang_ja from './lang/ja.json' with { type: 'json' };
import lang_ko from './lang/ko.json' with { type: 'json' };
import lang_zhtw from './lang/zh-tw.json' with { type: 'json' };
import { inverse_mapping } from './ygo-utility.mjs';

function object_to_map(obj) {
	const entries = Object.entries(obj);
	for (const pair of entries) {
		const id = Number.parseInt(pair[0], 10);
		if (!Number.isSafeInteger(id)) {
			console.error('object_to_map: invalid id', pair[0]);
			continue;
		}
		pair[0] = id;
	}
	const map = new Map(entries);
	return map;
}

const cid_table = object_to_map(cid_json);
const md_table_sc = object_to_map(md_sc);

const name_table = Object.create(null);
name_table['ae'] = object_to_map(ae_table);
name_table['en'] = object_to_map(en_table);
name_table['ja'] = object_to_map(jp_table);
name_table['ko'] = object_to_map(kr_table);
name_table['ruby'] = object_to_map(ruby_table);

const md_table = Object.create(null);
md_table['en'] = object_to_map(md_en_table);
md_table['ja'] = object_to_map(md_jp_table);

for (const [cid, id] of cid_table) {
	if (!name_table['ja'].has(cid) && !name_table['en'].has(cid)) {
		console.error('cid_table: invalid cid', cid);
		cid_table.delete(id);
	}
}
const id_to_cid = inverse_mapping(cid_table);

const official_name = Object.create(null);
official_name['ae'] = 'ae_name';
official_name['en'] = 'en_name';
official_name['ja'] = 'jp_name';
official_name['ko'] = 'kr_name';

const lang = Object.create(null);
lang['ae'] = lang_ae;
lang['en'] = lang_en;
lang['ja'] = lang_ja;
lang['ko'] = lang_ko;
lang['zh-tw'] = lang_zhtw;

const collator_locale = Object.create(null);
collator_locale['ae'] = 'en-US';
collator_locale['en'] = 'en-US';
collator_locale['ja'] = 'ja-JP';
collator_locale['ko'] = 'ko-KR';
collator_locale['zh-tw'] = 'zh-Hant';

const bls_postfix = Object.create(null);
bls_postfix['ae'] = ' (Normal)';
bls_postfix['en'] = ' (Normal)';
bls_postfix['ja'] = '（通常モンスター）';
bls_postfix['ko'] = ' (일반)';
bls_postfix['zh-tw'] = '（通常怪獸）';

const game_name = Object.create(null);
game_name['en'] = 'md_name_en';
game_name['ja'] = 'md_name_jp';

export {
	ltable_ocg, ltable_tcg, ltable_md,
	md_card_list,
	cid_table,
	id_to_cid,
	lang,
	collator_locale,
	bls_postfix,
	official_name,
	game_name,
	name_table,
	md_table,
	md_table_sc,
	jp_table,
}
