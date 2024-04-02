import ltable_ocg from './data/lflist.json' assert { type: 'json' };
import ltable_tcg from './data/lflist_tcg.json' assert { type: 'json' };
import ltable_md from './data/lflist_md.json' assert { type: 'json' };
import md_card_list from './data/CardList.json' assert { type: 'json' };

import cid_json from './data/cid_table.json' assert { type: 'json' };
import ae_table from './data/name_table_ae.json' assert { type: 'json' };
import en_table from './data/name_table_en.json' assert { type: 'json' };
import jp_table from './data/name_table_jp.json' assert { type: 'json' };
import kr_table from './data/name_table_kr.json' assert { type: 'json' };
import md_en_table from './data/md_name_en.json' assert { type: 'json' };
import md_jp_table from './data/md_name_jp.json' assert { type: 'json' };

import lang_ae from './lang/ae.json' assert { type: 'json' };
import lang_en from './lang/en.json' assert { type: 'json' };
import lang_ja from './lang/ja.json' assert { type: 'json' };
import lang_ko from './lang/ko.json' assert { type: 'json' };
import lang_zhtw from './lang/zh-tw.json' assert { type: 'json' };

function object_to_map(obj) {
	const map = new Map();
	for (const [key, value] of Object.entries(obj))
		map.set(Number.parseInt(key), value);
	return map;
}

const cid_table = object_to_map(cid_json);
const name_table_ae = object_to_map(ae_table);
const name_table_en = object_to_map(en_table);
const name_table_jp = object_to_map(jp_table);
const name_table_kr = object_to_map(kr_table);
const md_name_en = object_to_map(md_en_table);
const md_name_jp = object_to_map(md_jp_table);

for (const [cid, id] of cid_table) {
	if (!name_table_en.has(cid) && !name_table_jp.has(cid)) {
		console.error('cid_table: invalid cid', cid);
		cid_table.delete(id);
	}
}

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

const name_table = Object.create(null);
name_table['ae'] = name_table_ae;
name_table['en'] = name_table_en;
name_table['ja'] = name_table_jp;
name_table['ko'] = name_table_kr;

const md_table = Object.create(null);
md_table['en'] = md_name_en;
md_table['ja'] = md_name_jp;

export {
	ltable_ocg, ltable_tcg, ltable_md,
	md_card_list,
	cid_table,
	name_table_en, name_table_jp, name_table_kr,
	md_name_en, md_name_jp,
	lang,
	collator_locale,
	bls_postfix,
	official_name,
	game_name,
	name_table,
	md_table,
}
