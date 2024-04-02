export function print_db_link(cid, request_locale) {
	return `https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=${cid}&request_locale=${request_locale}`;
}

export function print_yp_link(id) {
	return `https://yugipedia.com/wiki/${id.toString().padStart(8, '0')}`;
}

export function print_qa_link(cid) {
	return `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=${cid}&request_locale=ja`;
}

export function print_history_link(cid) {
	return `https://github.com/salix5/ygodb/commits/master/${cid}.txt`;
}

/**
 * @param {string} string 
 * @returns 
 */
export function escape_regexp(string) {
	return string.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
}

/**
 * @param {Map} map 
 * @param {Function} compare 
 * @returns
 */
export function map_stringify(map, compare) {
	return JSON.stringify(Object.fromEntries([...map].sort(compare)), null, 1);
}

/**
 * @param {Map} map 
 * @returns 
 */
export function table_stringify(map) {
	return JSON.stringify(Object.fromEntries(map), null, 1);
}
