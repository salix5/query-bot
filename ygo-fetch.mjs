const domain = 'https://github.com/salix5/cdb/releases/latest/download';
const db_url1 = `${domain}/cards.cdb`;
const db_url2 = `${domain}/pre-release.cdb`;

export { db_url1, db_url2 };

/**
 * @param {string} url 
 * @returns 
 */
export async function fetch_db(url) {
	const resp = await fetch(url);
	if (!resp.ok) {
		throw new Error(`Failed to fetch ${url}: ${resp.status} ${resp.statusText}`);
	}
	return resp.bytes();
}
