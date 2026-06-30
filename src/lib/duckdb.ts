import * as duckdb from "@duckdb/duckdb-wasm";

let db: duckdb.AsyncDuckDB | null = null;
let conn: duckdb.AsyncDuckDBConnection | null = null;

export async function initDuckDB(): Promise<void> {
  if (db) return;

  const CDN = "https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.33.1-dev20.0/dist/";

  const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
    mvp: {
      mainModule: CDN + "duckdb-mvp.wasm",
      mainWorker: CDN + "duckdb-browser-mvp.worker.js",
    },
    eh: {
      mainModule: CDN + "duckdb-eh.wasm",
      mainWorker: CDN + "duckdb-browser-eh.worker.js",
    },
  };

  const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
  // Fetch worker script as blob to avoid cross-origin restriction
  const workerRes = await fetch(bundle.mainWorker!);
  const workerBlob = new Blob([await workerRes.text()], { type: "application/javascript" });
  const worker = new Worker(URL.createObjectURL(workerBlob));
  const logger = new duckdb.ConsoleLogger();
  db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  conn = await db.connect();
}

export async function loadJSON(jsonData: Record<string, unknown>[]): Promise<number> {
  if (!conn) throw new Error("DuckDB not initialized");

  await conn.query("DROP TABLE IF EXISTS tickets");

  const cleaned = jsonData.map((row) => {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(row)) {
      out[k] = v === "" ? null : v;
    }
    return out;
  });

  const jsonStr = JSON.stringify(cleaned);
  await db!.registerFileText("tickets.json", jsonStr);

  await conn.query(
    "CREATE TABLE tickets AS SELECT * FROM read_json_auto('tickets.json', maximum_object_size=10485760)"
  );

  const result = await conn.query("SELECT count(*) as cnt FROM tickets");
  return Number(result.toArray()[0].cnt);
}

export async function query<T = Record<string, unknown>>(sql: string): Promise<T[]> {
  if (!conn) throw new Error("DuckDB not initialized");
  const result = await conn.query(sql);
  return result.toArray().map((row: Record<string, unknown>) => {
    const obj: Record<string, unknown> = {};
    for (const key of Object.keys(row)) {
      obj[key] = row[key];
    }
    return obj as T;
  });
}

export async function getWeeks(): Promise<string[]> {
  const rows = await query<{ week_start: string }>(
    "SELECT DISTINCT CAST(CAST(date_trunc('week', opened_at) AS DATE) AS VARCHAR) as week_start FROM tickets WHERE opened_at IS NOT NULL ORDER BY week_start DESC"
  );
  return rows.map((r) => String(r.week_start).slice(0, 10));
}

/** Earliest and latest opened_at dates in the data, as YYYY-MM-DD strings. */
export async function getDateRange(): Promise<{ min: string; max: string }> {
  const rows = await query<{ min_d: string; max_d: string }>(
    "SELECT CAST(min(opened_at) AS VARCHAR) as min_d, CAST(max(opened_at) AS VARCHAR) as max_d FROM tickets WHERE opened_at IS NOT NULL"
  );
  return {
    min: String(rows[0]?.min_d ?? "").slice(0, 10),
    max: String(rows[0]?.max_d ?? "").slice(0, 10),
  };
}

/**
 * SQL predicate for an inclusive [from, to] date range on a timestamp column.
 * The upper bound is exclusive of (to + 1 day) so the whole `to` day is included.
 */
export function rangeClause(col: string, from: string, to: string): string {
  return `${col} >= DATE '${from}' AND ${col} < DATE '${to}' + INTERVAL 1 DAY`;
}
