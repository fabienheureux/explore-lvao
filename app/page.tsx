"use client";

import { useState, useEffect } from "react";
import { useDuckDB } from "@/hooks/useDuckDB";
import { MapView } from "@/components/MapView";
import { FiltersPanel, type Filters } from "@/components/FiltersPanel";
import { Alert } from "@codegouvfr/react-dsfr/Alert";

export default function Home() {
  const { isLoading, loadProgress, error, searchActors } = useDuckDB();
  const [filters, setFilters] = useState<Filters>({
    searchTerm: "",
    source: "",
    typeActeur: "",
    action: "",
  });
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Load all results on initialization
  useEffect(() => {
    if (!isLoading && !error) {
      handleSearch();
    }
  }, [isLoading, error]);

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const data = await searchActors(filters);
      setResults(data);
    } catch (err) {
      console.error("Erreur de recherche:", err);
    } finally {
      setIsSearching(false);
    }
  };

  if (error) {
    return (
      <div className="fr-container fr-mt-4w">
        <Alert severity="error" title="Erreur" description={error} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="fr-container">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            gap: "2rem",
          }}
        >
          <div className="fr-loader" aria-label="Chargement en cours" />
          <p className="fr-text--lg">{loadProgress}</p>
          <p
            className="fr-text--sm"
            style={{ color: "var(--text-mention-grey)" }}
          >
            Le chargement initial peut prendre quelques instants...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      {/* Filters Panel - Fixed at top */}
      <div
        style={{
          position: "fixed",
          top: "1rem",
          left: "1rem",
          zIndex: 10,
          maxWidth: "600px",
          width: "calc(100vw - 2rem)",
          backgroundColor: "var(--background-default-grey)",
          borderRadius: "0.5rem",
          boxShadow: "var(--lifted-shadow)",
          padding: "1.5rem",
          maxHeight: "calc(100vh - 2rem)",
          overflowY: "auto",
        }}
      >
        <FiltersPanel
          filters={filters}
          onFiltersChange={setFilters}
          onSearch={handleSearch}
          isSearching={isSearching}
          resultsCount={results.length}
        />
      </div>

      {/* Map */}
      <MapView data={results} />
    </div>
  );
}
