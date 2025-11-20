import type { AsyncDuckDB } from "@duckdb/duckdb-wasm";
import * as duckdb from "@duckdb/duckdb-wasm";

let dbInstance: AsyncDuckDB | null = null;

export async function instantiateDuckDb(): Promise<AsyncDuckDB> {
  if (typeof window === "undefined") {
    throw new Error("DuckDB ne peut être instancié que depuis le navigateur.");
  }

  // Return cached instance if available
  if (dbInstance) {
    return dbInstance;
  }

  // Use jsdelivr bundles which are CORS-enabled
  const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();

  // Select a bundle based on browser checks
  const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

  if (!bundle.mainWorker) {
    throw new Error("Échec de la sélection du bundle DuckDB");
  }

  // Fetch worker and create blob URL properly
  const workerResponse = await fetch(bundle.mainWorker);
  const workerText = await workerResponse.text();
  const workerBlob = new Blob([workerText], { type: "application/javascript" });
  const workerUrl = URL.createObjectURL(workerBlob);

  const worker = new Worker(workerUrl, { type: "module" });
  const logger = new duckdb.ConsoleLogger();
  const db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

  dbInstance = db;
  return db;
}

export async function loadDataset(db: AsyncDuckDB): Promise<void> {
  const conn = await db.connect();

  try {
    // Load the CSV from the public directory (downloaded during build)
    // The file is served from the same origin, so no CORS issues
    const csvUrl = `${window.location.origin}/acteurs.csv`;

    // Register the CSV file
    await db.registerFileURL("acteurs.csv", csvUrl, 4, false);

    // Load spatial extension and create the table with error handling for malformed CSV
    await conn.query(`
      LOAD spatial;
      CREATE TABLE IF NOT EXISTS acteurs AS
      SELECT * FROM read_csv_auto('acteurs.csv',
        ignore_errors=true,
        null_padding=true
      );
    `);
  } finally {
    await conn.close();
  }
}
