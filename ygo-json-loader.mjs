import ltable_ocg from './data/lflist.json' assert { type: 'json' };
import ltable_tcg from './data/lflist_tcg.json' assert { type: 'json' };
import ltable_md from './data/lflist_md.json' assert { type: 'json' };

import cid_entry from './data/cid_table.json' assert { type: 'json' };
import en_entry from './data/name_table_en.json' assert { type: 'json' };
import jp_entry from './data/name_table_jp.json' assert { type: 'json' };
import kr_entry from './data/name_table_kr.json' assert { type: 'json' };
import md_entry from './data/md_name.json' assert { type: 'json' };
import md_en_entry from './data/md_name_en.json' assert { type: 'json' };
import md_jp_entry from './data/md_name_jp.json' assert { type: 'json' };

import lang_en from './lang/en.json' assert { type: 'json' };
import lang_ja from './lang/ja.json' assert { type: 'json' };
import lang_ko from './lang/ko.json' assert { type: 'json' };
import lang_zhtw from './lang/zh-tw.json' assert { type: 'json' };

const cid_table = new Map(cid_entry);
const name_table_en = new Map(en_entry);
const name_table_jp = new Map(jp_entry);
const name_table_kr = new Map(kr_entry);
const md_name = new Map(md_entry);
const md_name_en = new Map(md_en_entry);
const md_name_jp = new Map(md_jp_entry);

const lang = Object.create(null);
lang['en'] = lang_en;
lang['ja'] = lang_ja;
lang['ko'] = lang_ko;
lang['zh-tw'] = lang_zhtw;

const collator_locale = Object.create(null);
collator_locale['en'] = 'en-US';
collator_locale['ja'] = 'ja-JP';
collator_locale['ko'] = 'ko-KR';
collator_locale['zh-tw'] = 'zh-Hant';

const bls_postfix = Object.create(null);
bls_postfix['en'] = ' (Normal)';
bls_postfix['ja'] = '（通常モンスター）';
bls_postfix['ko'] = ' (일반)';
bls_postfix['zh-tw'] = '（通常怪獸）';

const official_name = Object.create(null);
official_name['en'] = 'en_name';
official_name['ja'] = 'jp_name';
official_name['ko'] = 'kr_name';

const game_name = Object.create(null);
game_name['en'] = 'md_name_en';
game_name['ja'] = 'md_name_jp';

const name_table = Object.create(null);
name_table['en'] = name_table_en;
name_table['ja'] = name_table_jp;
name_table['ko'] = name_table_kr;
name_table['md'] = md_name;

const md_table = Object.create(null);
md_table['en'] = md_name_en;
md_table['ja'] = md_name_jp;

export {
	ltable_ocg, ltable_tcg, ltable_md,
	cid_table,
	name_table_en, name_table_jp, name_table_kr,
	md_name, md_name_en, md_name_jp,
	lang,
	collator_locale,
	bls_postfix,
	official_name,
	game_name,
	name_table,
	md_table,
}
