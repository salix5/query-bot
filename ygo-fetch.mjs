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

export async function fetch_text(url, max_size, timeout) {
	const sizeController = new AbortController();
	const combinedSignal = AbortSignal.any([sizeController.signal, AbortSignal.timeout(timeout)]);
	const resp = await fetch(url, { referrer: '', signal: combinedSignal });
	if (!resp.ok) {
		throw new Error(`Failed to fetch ${url}: ${resp.status} ${resp.statusText}`);
	}
	if (!resp.body) {
		throw new Error(`Response body is null for ${url}`);
	}
	const chunks = [];
	let received = 0;
	for await (const chunk of resp.body) {
		received += chunk.length;
		if (received > max_size) {
			sizeController.abort();
			throw new Error(`Response size exceeds ${max_size} bytes`);
		}
		chunks.push(chunk);
	}
	return Buffer.concat(chunks).toString();
}
