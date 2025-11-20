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
  epci?: string;
  bounds?: {
    minLng: number;
    maxLng: number;
    minLat: number;
    maxLat: number;
  };
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

      // Filter by name, SIRET, or SIREN (case-insensitive)
      if (filters.searchTerm) {
        const sanitized = filters.searchTerm.replace(/'/g, "''");
        conditions.push(`(
          LOWER(nom) LIKE LOWER('%${sanitized}%') OR
          LOWER(siret) LIKE LOWER('%${sanitized}%') OR
          LOWER(siren) LIKE LOWER('%${sanitized}%')
        )`);
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

      // Filter by EPCI code
      if (filters.epci) {
        const sanitized = filters.epci.replace(/'/g, "''");
        conditions.push(`code_epci = '${sanitized}'`);
      }

      // Filter by spatial bounds (bounding box)
      if (filters.bounds) {
        const { minLng, maxLng, minLat, maxLat } = filters.bounds;
        conditions.push(`
          longitude >= ${minLng} AND longitude <= ${maxLng} AND
          latitude >= ${minLat} AND latitude <= ${maxLat}
        `);
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

  // Get a single actor by ID or coordinates
  const getActorDetails = useCallback(
    async (latitude: number, longitude: number): Promise<any | null> => {
      if (!connection) {
        return null;
      }

      const sql = `
        SELECT * FROM acteurs
        WHERE latitude = ${latitude} AND longitude = ${longitude}
        LIMIT 1;
      `;

      const results = await executeQuery(sql);
      return results.length > 0 ? results[0] : null;
    },
    [connection, executeQuery],
  );

  // Get distinct filter options from the database
  const getFilterOptions = useCallback(async () => {
    if (!connection) {
      return null;
    }

    try {
      const [sources, types, actions] = await Promise.all([
        executeQuery(`
          SELECT DISTINCT paternite as value
          FROM acteurs
          WHERE paternite IS NOT NULL
          ORDER BY paternite;
        `),
        executeQuery(`
          SELECT DISTINCT type_dacteur as value
          FROM acteurs
          WHERE type_dacteur IS NOT NULL
          ORDER BY type_dacteur;
        `),
        executeQuery(`
          SELECT DISTINCT json_extract_string(propositions_de_services, '$.action') as value
          FROM acteurs
          WHERE propositions_de_services IS NOT NULL
          AND json_extract_string(propositions_de_services, '$.action') IS NOT NULL
          ORDER BY value;
        `),
      ]);

      return {
        sources: [
          { value: "", label: "Toutes les sources" },
          ...sources.map((s: any) => ({ value: s.value, label: s.value })),
        ],
        types: [
          { value: "", label: "Tous les types" },
          ...types.map((t: any) => ({ value: t.value, label: t.value })),
        ],
        actions: [
          { value: "", label: "Toutes les actions" },
          ...actions.map((a: any) => ({ value: a.value, label: a.value })),
        ],
      };
    } catch (error) {
      console.error("Error loading filter options:", error);
      return null;
    }
  }, [connection, executeQuery]);

  // Get statistics for displayed data
  const getStatistics = useCallback(
    async (filters: SearchFilters = {}): Promise<any> => {
      if (!connection) {
        return null;
      }

      const conditions: string[] = [];

      // Apply same filters as searchActors
      if (filters.searchTerm) {
        const sanitized = filters.searchTerm.replace(/'/g, "''");
        conditions.push(`LOWER(nom) LIKE LOWER('%${sanitized}%')`);
      }
      if (filters.source) {
        const sanitized = filters.source.replace(/'/g, "''");
        conditions.push(`paternite LIKE '%${sanitized}%'`);
      }
      if (filters.typeActeur) {
        const sanitized = filters.typeActeur.replace(/'/g, "''");
        conditions.push(`type_dacteur = '${sanitized}'`);
      }
      if (filters.action) {
        const sanitized = filters.action.replace(/'/g, "''");
        conditions.push(
          `propositions_de_services LIKE '%"action": "${sanitized}"%'`,
        );
      }
      if (filters.epci) {
        const sanitized = filters.epci.replace(/'/g, "''");
        conditions.push(`code_epci = '${sanitized}'`);
      }

      const whereClause =
        conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

      // Query for multiple statistics
      const [bySource, byType, byEpci] = await Promise.all([
        executeQuery(`
          SELECT paternite as label, COUNT(*) as count
          FROM acteurs
          ${whereClause}
          GROUP BY paternite
          ORDER BY count DESC
          LIMIT 10;
        `),
        executeQuery(`
          SELECT type_dacteur as label, COUNT(*) as count
          FROM acteurs
          ${whereClause}
          GROUP BY type_dacteur
          ORDER BY count DESC;
        `),
        executeQuery(`
          SELECT code_epci as label, COUNT(*) as count
          FROM acteurs
          ${whereClause}
          WHERE code_epci IS NOT NULL
          GROUP BY code_epci
          ORDER BY count DESC
          LIMIT 15;
        `),
      ]);

      return {
        bySource,
        byType,
        byEpci,
      };
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
    getActorDetails,
    getFilterOptions,
    getStatistics,
  };
}
