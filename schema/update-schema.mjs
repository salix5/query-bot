import { readFileSync } from "node:fs";

export function update_schema(db) {
	const sql_schema = readFileSync(new URL('./migrate.sql', import.meta.url), 'utf8');
	db.exec(sql_schema);
}
