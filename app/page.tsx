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
  const [hoveredActor, setHoveredActor] = useState<any | null>(null);
  const mapRef = useRef<any>(null);
  const statsDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load filter options and initial results on initialization
  useEffect(() => {
    if (!isLoading && !error) {
      loadInitialData();
    }
  }, [isLoading, error]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (statsDebounceTimerRef.current) {
        clearTimeout(statsDebounceTimerRef.current);
      }
    };
  }, []);

  const loadInitialData = async () => {
    // Load filter options first
    const options = await getFilterOptions();
    setFilterOptions(options);

    // Load initial results for default view (Angers area)
    await performInitialSearch();
  };

  const performInitialSearch = async () => {
    if (!mapRef.current) {
      // If map isn't ready yet, try again after a short delay
      setTimeout(performInitialSearch, 100);
      return;
    }

    const map = mapRef.current.getMap();
    const bounds = map.getBounds();

    const boundsFilter = {
      minLng: bounds.getWest(),
      maxLng: bounds.getEast(),
      minLat: bounds.getSouth(),
      maxLat: bounds.getNorth(),
    };

    setIsSearching(true);
    setHasSearched(true);
    try {
      const data = await searchActors({
        ...filters,
        bounds: boundsFilter,
      });
      setResults(data);
      await updateStats({
        ...filters,
        bounds: boundsFilter,
      });

      // Enable spatial mode after initial load
      setIsSpatialMode(true);
    } catch (err) {
      console.error("Erreur de recherche initiale:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async () => {
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
    setHasSearched(true);
    setIsSpatialMode(true); // Enable spatial mode to keep searching on map move
    try {
      const data = await searchActors({
        ...filters,
        bounds: boundsFilter,
      });
      setResults(data);
      // Update stats automatically after search
      await updateStats({
        ...filters,
        bounds: boundsFilter,
      });
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

  const handleEpciSelect = async (epciCode: string) => {
    // Query DuckDB to get the bounds of actors in this EPCI
    try {
      const epciActors = await searchActors({ epci: epciCode });

      if (epciActors.length === 0) {
        console.log("No actors found for EPCI:", epciCode);
        return;
      }

      // Calculate bounds from all actors in this EPCI
      const lngs = epciActors.map((a: any) => a.longitude).filter(Boolean);
      const lats = epciActors.map((a: any) => a.latitude).filter(Boolean);

      if (lngs.length === 0 || lats.length === 0) {
        return;
      }

      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);

      // Zoom to EPCI bounds
      if (mapRef.current) {
        mapRef.current.fitBounds(
          [
            [minLng, minLat],
            [maxLng, maxLat],
          ],
          {
            padding: 50,
            duration: 1500,
          },
        );

        // Wait for animation, then trigger search with EPCI filter
        setTimeout(() => {
          setIsSpatialMode(true);
          setHasSearched(true);
          searchByMapBounds();
        }, 1600);
      }
    } catch (err) {
      console.error("Error zooming to EPCI:", err);
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
      await updateStats({
        ...filters,
        bounds: boundsFilter,
      });
    } catch (err) {
      console.error("Erreur de recherche spatiale:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const updateStatsImmediate = async (filtersWithBounds?: any) => {
    setIsLoadingStats(true);
    try {
      const statsData = await getStatistics(filtersWithBounds || filters);
      setStats(statsData);
    } catch (err) {
      console.error("Erreur de chargement des statistiques:", err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const updateStats = (filtersWithBounds?: any) => {
    // Clear existing timer
    if (statsDebounceTimerRef.current) {
      clearTimeout(statsDebounceTimerRef.current);
    }

    // Set new debounced timer (2 seconds)
    statsDebounceTimerRef.current = setTimeout(() => {
      updateStatsImmediate(filtersWithBounds);
    }, 2000);
  };

  const handleOpenStats = async () => {
    // Refresh stats immediately with current bounds when opening modal
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      const bounds = map.getBounds();

      const boundsFilter = {
        minLng: bounds.getWest(),
        maxLng: bounds.getEast(),
        minLat: bounds.getSouth(),
        maxLat: bounds.getNorth(),
      };

      // Use immediate update for modal opening (no debounce)
      await updateStatsImmediate({
        ...filters,
        bounds: boundsFilter,
      });
    }
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
          onEpciSelect={handleEpciSelect}
        />
      </div>

      {/* Map */}
      <MapView
        data={hasSearched ? results : []}
        mapRef={mapRef}
        onMapMove={searchByMapBounds}
        isSpatialMode={isSpatialMode}
        onMarkerHover={setHoveredActor}
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

      {/* Hovered Actor Display */}
      {hoveredActor && (
        <div
          style={{
            position: "fixed",
            bottom: "1rem",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
            backgroundColor: "var(--background-default-grey)",
            borderRadius: "0.5rem",
            boxShadow: "var(--lifted-shadow)",
            padding: "1.5rem 2rem",
            minWidth: "400px",
            maxWidth: "600px",
          }}
        >
          <p
            style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              margin: 0,
              color: "var(--text-title-grey)",
            }}
          >
            {hoveredActor.nom}
          </p>
          {hoveredActor.adresse && (
            <p
              style={{
                fontSize: "0.875rem",
                margin: "0.5rem 0 0 0",
                color: "var(--text-mention-grey)",
              }}
            >
              {hoveredActor.adresse}
              {hoveredActor.code_postal && `, ${hoveredActor.code_postal}`}
              {hoveredActor.ville && ` ${hoveredActor.ville}`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
