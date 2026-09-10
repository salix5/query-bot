import { readFileSync } from "node:fs";
import path from "node:path";

export function update_schema(db) {
	const sql_schema = readFileSync(path.join(import.meta.dirname, 'migrate.sql'), 'utf8');
	db.exec(sql_schema);
}
