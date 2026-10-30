/**
 * @param {string} url 
 * @returns 
 */
export async function fetch_db(url) {
	const resp = await fetch(url);
	if (!resp.ok) {
		throw new Error(`fetch failed: ${resp.status} ${url}`);
	}
	return resp.bytes();
}

export async function fetch_text(url, {
	max_size = 2 * 1024 * 1024,
	timeout = 15000,
	headers = {}
} = {}) {
	const sizeController = new AbortController();
	const combinedSignal = AbortSignal.any([sizeController.signal, AbortSignal.timeout(timeout)]);
	const resp = await fetch(url, {
		method: 'GET',
		headers,
		referrer: '',
		signal: combinedSignal,
	});
	if (!resp.ok) {
		throw new Error(`fetch failed: ${resp.status} ${url}`);
	}
	if (!resp.body) {
		throw new Error(`null response: ${url}`);
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
