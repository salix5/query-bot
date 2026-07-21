import { readFile } from "node:fs/promises";

export async function update_schema(db) {
	const sql_schema = await readFile(new URL('./migrate.sql', import.meta.url),'utf8');
	db.exec(sql_schema);
}
