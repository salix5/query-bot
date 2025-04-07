const re_id = /^\d{1,9}$/;
const re_positive = /^\d{1,10}$/;
const re_negative = /^-?\d{1,10}$/;
const re_value = /^\d{1,2}$/;

const interface_type = {
	"cardtype": 1,
	"subtype": 1,
	"subtype_operator": 1,
	"exclude": 1,
	
	"attribute": 2,
	"race": 2,
	"level": 2,
	"lv1": 2,
	"lv2": 2,
	"scale": 2,
	"sc1": 2,
	"sc2": 2,
	"atk1": 2,
	"atk2": 2,
	"def1": 2,
	"def2": 2,
	"sum": 2,

	"material": 3,
	"marker": 3,
	"marker_operator": 3,
}

export {
	interface_type,
}

/**
 * @param {URLSearchParams} params 
 * @param {string} key 
 * @returns 
 */
function check_number(params, key) {
	if (!params.has(key))
		return false;
	const value = params.get(key);
	if (!re_positive.test(value)) {
		params.delete(key);
		return false;
	}
	params.set(key, value);
	return true
}

/**
 * @param {URLSearchParams} params 
 * @param {string} key 
 * @returns 
 */
function check_negative(params, key) {
	if (!params.has(key))
		return false;
	const value = params.get(key);
	if (!re_negative.test(value)) {
		params.delete(key);
		return false;
	}
	params.set(key, value);
	return true
}

/**
 * @param {URLSearchParams} params 
 * @param {string} name 
 * @returns 
 */
function check_checkbox(params, name) {
	const values = params.getAll(name);
	params.delete(name);
	for (const value of values) {
		if (!re_value.test(value))
			continue;
		if (params.has(name, value))
			continue;
		params.append(name, value);
	}
}

/**
 * @param {URLSearchParams} params 
 * @returns 
 */
export function validate_params(params) {
	const result = new URLSearchParams();
	if (params.has("code") && re_id.test(params.get("code"))) {
		result.set("code", params.get("code"));
		return result;
	}
	if (params.has("cid") && re_id.test(params.get("cid"))) {
		result.set("cid", params.get("cid"));
		return result;
	}
	check_number(params, "cardtype");
	const cardtype = params.has("cardtype") ? Number.parseInt(params.get("cardtype")) : 0;
	if (!cardtype || (cardtype & ~0x7)) {
		params.delete("cardtype");
	}
	if (params.has("cardtype")) {
		check_number(params, "subtype");
		check_number(params, "exclude");
		if (params.has("subtype") && params.has("subtype_operator", "1"))
			params.set("subtype_operator", "1");
		else
			params.delete("subtype_operator");
	}
	else {
		params.delete("subtype");
		params.delete("exclude");
		params.delete("subtype_operator");
	}
	if (!params.has("cardtype") || params.has("cardtype", "1")) {
		check_number(params, "attribute");
		check_number(params, "race");
		check_checkbox(params, "level");
		check_checkbox(params, "scale");
		if (params.has("level")) {
			params.delete("lv1");
			params.delete("lv2");
		}
		else {
			check_number(params, "lv1");
			check_number(params, "lv2");
		}
		if (params.has("scale")) {
			params.delete("sc1");
			params.delete("sc2");
		}
		else {
			check_number(params, "sc1");
			check_number(params, "sc2");
		}
		check_number(params, "marker");
		if (params.has("marker") && params.has("marker_operator", "1"))
			params.set("marker_operator", "1");
		else
			params.delete("marker_operator");
		check_negative(params, "atk1");
		const atk1 = params.has("atk1") ? Number.parseInt(params.get("atk1")) : -10;
		if (atk1 < -1) {
			params.delete("atk1");
		}
		else if (atk1 < 0) {
			params.delete("atk2");
			params.delete("sum");
		}
		check_number(params, "atk2");

		check_negative(params, "def1");
		const def1 = params.has("def1") ? Number.parseInt(params.get("def1")) : -10;
		if (def1 < -2) {
			params.delete("def1");
		}
		else if (def1 < 0) {
			params.delete("def2");
			params.delete("sum");
		}
		check_number(params, "def2");
		check_number(params, "sum");
	}
	for (const key of Object.keys(interface_type)) {
		for (const value of params.getAll(key)) {
			result.append(key, value);
		}
	}
	return result;
}
