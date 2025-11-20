"use client";

import { useState, useEffect, useRef } from "react";
import { useDuckDB } from "@/hooks/useDuckDB";
import { MapView } from "@/components/MapView";
import { FiltersPanel, type Filters } from "@/components/FiltersPanel";
import { StatsModal, statsModal } from "@/components/StatsModal";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";

export default function Home() {
  const {
    isLoading,
    loadProgress,
    error,
    searchActors,
    getStatistics,
    getFilterOptions,
  } = useDuckDB();
  const [filters, setFilters] = useState<Filters>({
    searchTerm: "",
    source: "",
    typeActeur: "",
    action: "",
    epci: "",
  });
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [filterOptions, setFilterOptions] = useState<any>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSpatialMode, setIsSpatialMode] = useState(false);
  const mapRef = useRef<any>(null);

  // Load filter options and initial results on initialization
  useEffect(() => {
    if (!isLoading && !error) {
      loadInitialData();
    }
  }, [isLoading, error]);

  const loadInitialData = async () => {
    // Load filter options first
    const options = await getFilterOptions();
    setFilterOptions(options);
    // Don't load initial results - wait for user search
  };

  const handleSearch = async () => {
    setIsSearching(true);
    setHasSearched(true);
    try {
      const data = await searchActors(filters);
      setResults(data);
      // Update stats automatically after search
      await updateStats();
    } catch (err) {
      console.error("Erreur de recherche:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocationClick = async (latitude: number, longitude: number) => {
    // Center map on user location
    if (mapRef.current) {
      await mapRef.current.flyTo({
        center: [longitude, latitude],
        zoom: 12,
        duration: 1500,
      });

      // Wait for animation to complete, then enable spatial mode
      setTimeout(() => {
        setIsSpatialMode(true);
        setHasSearched(true);
        searchByMapBounds();
      }, 1600);
    }
  };

  const searchByMapBounds = async () => {
    if (!mapRef.current) return;

    const map = mapRef.current.getMap();
    const bounds = map.getBounds();

    const boundsFilter = {
      minLng: bounds.getWest(),
      maxLng: bounds.getEast(),
      minLat: bounds.getSouth(),
      maxLat: bounds.getNorth(),
    };

    setIsSearching(true);
    try {
      const data = await searchActors({
        ...filters,
        bounds: boundsFilter,
      });
      setResults(data);
      await updateStats();
    } catch (err) {
      console.error("Erreur de recherche spatiale:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const updateStats = async () => {
    setIsLoadingStats(true);
    try {
      const statsData = await getStatistics(filters);
      setStats(statsData);
    } catch (err) {
      console.error("Erreur de chargement des statistiques:", err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleOpenStats = () => {
    statsModal.open();
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
          top: "0.75rem",
          left: "0.75rem",
          zIndex: 10,
          maxWidth: "550px",
          width: "calc(100vw - 1.5rem)",
          backgroundColor: "var(--background-default-grey)",
          borderRadius: "0.5rem",
          boxShadow: "var(--lifted-shadow)",
          padding: "1rem",
          maxHeight: "calc(100vh - 1.5rem)",
          overflowY: "auto",
        }}
      >
        <FiltersPanel
          filters={filters}
          onFiltersChange={setFilters}
          onSearch={handleSearch}
          isSearching={isSearching}
          resultsCount={results.length}
          sources={filterOptions?.sources}
          types={filterOptions?.types}
          actions={filterOptions?.actions}
          onLocationClick={handleLocationClick}
        />
      </div>

      {/* Map */}
      <MapView
        data={hasSearched ? results : []}
        mapRef={mapRef}
        onMapMove={searchByMapBounds}
        isSpatialMode={isSpatialMode}
      />

      {/* Floating Stats Button */}
      <div
        style={{
          position: "fixed",
          top: "0.75rem",
          right: "0.75rem",
          zIndex: 10,
        }}
      >
        <Button
          iconId="fr-icon-line-chart-line"
          onClick={handleOpenStats}
          size="medium"
          title="Afficher les statistiques"
        >
          Statistiques
        </Button>
      </div>

      {/* Stats Modal */}
      <StatsModal stats={stats} isLoading={isLoadingStats} />
    </div>
  );
}
