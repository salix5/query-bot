import { readFile } from "node:fs/promises";

export async function update_schema(db) {
    const [sql_schema, sql_setcode] = await Promise.all([
        readFile(new URL('./schema.sql', import.meta.url), 'utf8'),
        readFile(new URL('./setcode.sql', import.meta.url), 'utf8'),
    ]);
    db.exec(sql_schema);
    db.exec(sql_setcode);
}
