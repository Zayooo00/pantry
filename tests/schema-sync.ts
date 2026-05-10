import { is, sql, type SQL } from "drizzle-orm";
import { type LibSQLDatabase } from "drizzle-orm/libsql";
import { getTableConfig, SQLiteTable } from "drizzle-orm/sqlite-core";

/**
 * Generates and runs CREATE TABLE / CREATE INDEX statements for every drizzle
 * table in `schema`. Replaces hand-maintained DDL in tests/setup.ts so adding
 * a new table to db/schema.ts is picked up automatically.
 *
 * Only handles the column features this project actually uses: text/integer/real,
 * primaryKey, notNull, unique, default (literal or sql expression), references
 * with onDelete, and unique indexes.
 */
export async function applySchemaToSqlite(
  schema: Record<string, unknown>,
  db: LibSQLDatabase<Record<string, unknown>>,
): Promise<void> {
  const tables = Object.values(schema).filter((t): t is SQLiteTable => is(t, SQLiteTable));
  for (const table of tables) {
    const ddl = createTableSql(table);
    await db.run(sql.raw(ddl));
    for (const indexDdl of createIndexSqls(table)) {
      await db.run(sql.raw(indexDdl));
    }
  }
}

function createTableSql(table: SQLiteTable): string {
  const cfg = getTableConfig(table);
  const colDefs = cfg.columns.map(columnDdl);
  const fkDefs = cfg.foreignKeys.map(foreignKeyDdl);
  return `CREATE TABLE IF NOT EXISTS ${quoteId(cfg.name)} (\n  ${[...colDefs, ...fkDefs].join(",\n  ")}\n)`;
}

function columnDdl(col: ReturnType<typeof getTableConfig>["columns"][number]): string {
  const parts: string[] = [quoteId(col.name), sqliteType(col.dataType)];
  if (col.primary) {
    parts.push("PRIMARY KEY");
  }
  if (col.notNull) {
    parts.push("NOT NULL");
  }
  if (col.isUnique) {
    parts.push("UNIQUE");
  }
  const defaultClause = defaultDdl(col);
  if (defaultClause) {
    parts.push(defaultClause);
  }
  return parts.join(" ");
}

function defaultDdl(col: ReturnType<typeof getTableConfig>["columns"][number]): string | null {
  if (col.default === undefined) {
    return null;
  }
  // drizzle stores SQL defaults as SQL objects.
  if (typeof col.default === "object" && col.default !== null && "queryChunks" in col.default) {
    return `DEFAULT ${sqlToString(col.default as SQL)}`;
  }
  if (typeof col.default === "boolean") {
    return `DEFAULT ${col.default ? 1 : 0}`;
  }
  if (typeof col.default === "number") {
    return `DEFAULT ${col.default}`;
  }
  if (typeof col.default === "string") {
    return `DEFAULT '${col.default.replace(/'/g, "''")}'`;
  }
  return null;
}

function foreignKeyDdl(fk: ReturnType<typeof getTableConfig>["foreignKeys"][number]): string {
  const ref = fk.reference();
  const cols = ref.columns.map((c) => quoteId(c.name)).join(", ");
  const foreignTable = getTableConfig(ref.foreignTable).name;
  const foreignCols = ref.foreignColumns.map((c) => quoteId(c.name)).join(", ");
  let clause = `FOREIGN KEY (${cols}) REFERENCES ${quoteId(foreignTable)}(${foreignCols})`;
  if (fk.onDelete) {
    clause += ` ON DELETE ${fk.onDelete.toUpperCase()}`;
  }
  if (fk.onUpdate) {
    clause += ` ON UPDATE ${fk.onUpdate.toUpperCase()}`;
  }
  return clause;
}

function createIndexSqls(table: SQLiteTable): string[] {
  const cfg = getTableConfig(table);
  return cfg.indexes.map((idx) => {
    const config = idx.config;
    const cols = config.columns.map((c) => quoteId((c as { name: string }).name)).join(", ");
    const unique = config.unique ? "UNIQUE " : "";
    return `CREATE ${unique}INDEX IF NOT EXISTS ${quoteId(config.name)} ON ${quoteId(cfg.name)} (${cols})`;
  });
}

function sqliteType(dataType: string): string {
  switch (dataType) {
    case "string":
      return "TEXT";
    case "number":
    case "boolean":
    case "date":
      return "INTEGER";
    default:
      // real, etc.
      return dataType.toUpperCase();
  }
}

function sqlToString(s: SQL): string {
  // Reconstruct the SQL fragment from its chunks. We only emit literal text +
  // simple values, which is all the project's defaults use (e.g. unixepoch()).
  const chunks = (s as unknown as { queryChunks: Array<{ value?: string[] | string }> })
    .queryChunks;
  let out = "";
  for (const chunk of chunks) {
    if (typeof chunk.value === "string") {
      out += chunk.value;
    } else if (Array.isArray(chunk.value)) {
      out += chunk.value.join("");
    }
  }
  return out;
}

function quoteId(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}
