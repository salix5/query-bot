import { interface_types } from './ygo-constant.mjs';

const re_id = /^\d{1,9}$/;
const re_positive = /^\d{1,10}$/;
const re_negative = /^-?\d{1,10}$/;
const re_value = /^\d{1,2}$/;

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
	const value_set = new Set();
	for (const value of values) {
		if (!re_value.test(value))
			continue;
		if (value_set.has(value))
			continue;
		value_set.add(value);
		params.append(name, value);
	}
}

/**
 * @param {URLSearchParams} params 
 * @returns 
 */
export function validate_params(params) {
	const result = new URLSearchParams();
	if (params.has("id") && re_id.test(params.get("id"))) {
		result.set("id", params.get("id"));
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
		if (params.has("subtype")) {
			if(params.get("subtype_operator") === "1")
				params.set("subtype_operator", "1");
			else
				params.set("subtype_operator", "0");
		}
		else {
			params.delete("subtype_operator");
		}
	}
	else {
		params.delete("subtype");
		params.delete("exclude");
		params.delete("subtype_operator");
	}
	if (!params.has("cardtype") || params.get("cardtype") === "1") {
		check_number(params, "material");
		check_number(params, "attribute");
		check_number(params, "race");
		check_checkbox(params, "level");
		check_checkbox(params, "scale");
		if (params.has("level")) {
			params.delete("level_from");
			params.delete("level_to");
		}
		else {
			check_number(params, "level_from");
			check_number(params, "level_to");
		}
		if (params.has("scale")) {
			params.delete("scale_from");
			params.delete("scale_to");
		}
		else {
			check_number(params, "scale_from");
			check_number(params, "scale_to");
		}
		check_number(params, "marker");
		if (params.has("marker")) {
			if (params.get("marker_operator") === "1")
				params.set("marker_operator", "1");
			else
				params.set("marker_operator", "0");
		}
		else {
			params.delete("marker_operator");
		}
		check_negative(params, "atk_from");
		const atk_from = params.has("atk_from") ? Number.parseInt(params.get("atk_from")) : -10;
		if (atk_from < -1) {
			params.delete("atk_from");
		}
		else if (atk_from < 0) {
			params.delete("atk_to");
			params.delete("sum");
		}
		check_number(params, "atk_to");

		check_negative(params, "def_from");
		const def_from = params.has("def_from") ? Number.parseInt(params.get("def_from")) : -10;
		if (def_from < -2) {
			params.delete("def_from");
		}
		else if (def_from < 0) {
			params.delete("def_to");
			params.delete("sum");
		}
		check_number(params, "def_to");
		check_number(params, "sum");
	}
	else {
		for (const [key, type] of Object.entries(interface_types)) {
			if (type === 2 || type === 3)
				params.delete(key);
		}
	}
	for (const key of Object.keys(interface_types)) {
		for (const value of params.getAll(key)) {
			result.append(key, value);
		}
	}
	return result;
}
