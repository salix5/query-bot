const domain = 'https://salix5.github.io/cdb';
const db_url1 = `${domain}/cards.cdb`;
const db_url2 = `${domain}/expansions/pre-release.cdb`;

export { db_url1, db_url2 };

/**
 * @param {string} url 
 * @returns 
 */
export async function fetch_db(url) {
	return (await fetch(url)).bytes();
}
