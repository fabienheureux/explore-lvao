"use client";

import { useState, useEffect, useCallback } from "react";
import type { AsyncDuckDB, AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";
import { instantiateDuckDb, loadDataset } from "@/lib/duckdb";

export interface QueryResult {
  data: any[];
  loading: boolean;
  error: string | null;
}

export interface SearchFilters {
  searchTerm?: string;
  source?: string;
  typeActeur?: string;
  action?: string;
}

// Convert BigInt values to strings to avoid serialization issues
function convertBigIntsToStrings(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === "bigint") {
    return obj.toString();
  }

  if (Array.isArray(obj)) {
    return obj.map(convertBigIntsToStrings);
  }

  if (typeof obj === "object") {
    const converted: any = {};
    for (const key in obj) {
      converted[key] = convertBigIntsToStrings(obj[key]);
    }
    return converted;
  }

  return obj;
}

export function useDuckDB() {
  const [db, setDb] = useState<AsyncDuckDB | null>(null);
  const [connection, setConnection] = useState<AsyncDuckDBConnection | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState<string>("Initialisation...");
  const [error, setError] = useState<string | null>(null);

  // Initialize DuckDB and load the dataset
  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        setLoadProgress("Initialisation de DuckDB...");
        const dbInstance = await instantiateDuckDb();

        if (!isMounted) return;
        setDb(dbInstance);

        setLoadProgress("Chargement des données...");
        await loadDataset(dbInstance);

        if (!isMounted) return;
        setLoadProgress("Connexion à la base de données...");
        const conn = await dbInstance.connect();

        if (!isMounted) return;
        setConnection(conn);
        setIsLoading(false);
        setLoadProgress("Prêt");
      } catch (err) {
        console.error("Échec de l'initialisation de DuckDB:", err);
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Échec de l'initialisation de la base de données",
          );
          setIsLoading(false);
        }
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  // Execute a query
  const executeQuery = useCallback(
    async (sql: string): Promise<any[]> => {
      if (!connection) {
        throw new Error("Base de données non initialisée");
      }

      const result = await connection.query(sql);
      const rawData = result.toArray();

      // Convert BigInt values to strings to avoid serialization issues
      return convertBigIntsToStrings(rawData);
    },
    [connection],
  );

  // Search actors with multiple filters
  const searchActors = useCallback(
    async (filters: SearchFilters = {}): Promise<any[]> => {
      if (!connection) {
        return [];
      }

      const conditions: string[] = [];

      // Filter by name (case-insensitive)
      if (filters.searchTerm) {
        const sanitized = filters.searchTerm.replace(/'/g, "''");
        conditions.push(`LOWER(nom) LIKE LOWER('%${sanitized}%')`);
      }

      // Filter by source (in paternite field)
      if (filters.source) {
        const sanitized = filters.source.replace(/'/g, "''");
        conditions.push(`paternite LIKE '%${sanitized}%'`);
      }

      // Filter by type d'acteur
      if (filters.typeActeur) {
        const sanitized = filters.typeActeur.replace(/'/g, "''");
        conditions.push(`type_dacteur = '${sanitized}'`);
      }

      // Filter by action (in propositions_de_services field which is JSON)
      if (filters.action) {
        const sanitized = filters.action.replace(/'/g, "''");
        conditions.push(
          `propositions_de_services LIKE '%"action": "${sanitized}"%'`,
        );
      }

      let sql = "SELECT * FROM acteurs";
      if (conditions.length > 0) {
        sql += " WHERE " + conditions.join(" AND ");
      }
      sql += " LIMIT 1000000;"; // Reasonable limit for map rendering

      return executeQuery(sql);
    },
    [connection, executeQuery],
  );

  return {
    db,
    connection,
    isLoading,
    loadProgress,
    error,
    executeQuery,
    searchActors,
  };
}
