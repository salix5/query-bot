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

export {
	ltable_ocg, ltable_tcg, ltable_md,
	cid_table,
	name_table_en, name_table_jp, name_table_kr,
	md_name, md_name_en, md_name_jp,
	lang_en, lang_ja, lang_ko, lang_zhtw,
}
