"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Badge } from "@codegouvfr/react-dsfr/Badge";

export interface Filters {
  searchTerm: string;
  source: string;
  typeActeur: string;
  action: string;
  epci: string;
}

interface FilterOption {
  value: string;
  label: string;
}

interface FiltersPanelProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onSearch: () => void;
  isSearching: boolean;
  resultsCount: number;
  sources?: FilterOption[];
  types?: FilterOption[];
  actions?: FilterOption[];
  onLocationClick?: (latitude: number, longitude: number) => void;
}

export function FiltersPanel({
  filters,
  onFiltersChange,
  onSearch,
  isSearching,
  resultsCount,
  sources = [{ value: "", label: "Toutes les sources" }],
  types = [{ value: "", label: "Tous les types" }],
  actions = [{ value: "", label: "Toutes les actions" }],
  onLocationClick,
}: FiltersPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [epciSearch, setEpciSearch] = useState("");
  const [epciSuggestions, setEpciSuggestions] = useState<
    Array<{ code: string; nom: string }>
  >([]);
  const [showEpciSuggestions, setShowEpciSuggestions] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const updateFilter = (key: keyof Filters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    onFiltersChange({
      searchTerm: "",
      source: "",
      typeActeur: "",
      action: "",
      epci: "",
    });
    setEpciSearch("");
  };

  const hasActiveFilters =
    filters.searchTerm ||
    filters.source ||
    filters.typeActeur ||
    filters.action ||
    filters.epci;

  // Fetch EPCI suggestions from API
  const fetchEpciSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setEpciSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://geo.api.gouv.fr/epcis?nom=${encodeURIComponent(query)}&limit=10`,
      );
      const data = await response.json();
      setEpciSuggestions(data);
    } catch (error) {
      console.error("Erreur lors de la recherche EPCI:", error);
      setEpciSuggestions([]);
    }
  }, []);

  // Debounced EPCI search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEpciSuggestions(epciSearch);
    }, 300);

    return () => clearTimeout(timer);
  }, [epciSearch, fetchEpciSuggestions]);

  const handleEpciSelect = (code: string, nom: string) => {
    updateFilter("epci", code);
    setEpciSearch(nom);
    setShowEpciSuggestions(false);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("La géolocalisation n'est pas supportée par votre navigateur");
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsGettingLocation(false);
        if (onLocationClick) {
          onLocationClick(position.coords.latitude, position.coords.longitude);
        }
      },
      (error) => {
        setIsGettingLocation(false);
        console.error("Erreur de géolocalisation:", error);
        alert("Impossible d'obtenir votre position");
      },
    );
  };

  return (
    <div className="fr-container--fluid">
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <h1 className="fr-h3 fr-mb-2w">Que Faire de Mes Bidules</h1>
              {!isCollapsed && (
                <p className="fr-text--sm fr-mb-3w">
                  Carte interactive des acteurs de la réparation et du réemploi
                  en France
                </p>
              )}
            </div>
            <Button
              iconId={
                isCollapsed ? "fr-icon-search-line" : "fr-icon-arrow-up-s-line"
              }
              priority="tertiary no outline"
              size="small"
              title={
                isCollapsed ? "Afficher les filtres" : "Masquer les filtres"
              }
              onClick={() => setIsCollapsed(!isCollapsed)}
            />
          </div>
          {!isCollapsed && (
            <div className="fr-mt-2w">
              <Badge severity="info">
                {resultsCount.toLocaleString("fr-FR")} résultat
                {resultsCount > 1 ? "s" : ""}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <>
          <div className="fr-grid-row fr-grid-row--gutters">
            <div className="fr-col-12 fr-col-md-6">
              <Input
                label="Rechercher par nom"
                nativeInputProps={{
                  value: filters.searchTerm,
                  onChange: (e) => updateFilter("searchTerm", e.target.value),
                  onKeyDown: (e) => e.key === "Enter" && onSearch(),
                  placeholder: "Repair Café, Recyclerie...",
                  type: "text",
                }}
              />
            </div>

            <div className="fr-col-12 fr-col-md-6">
              <Select
                label="Source de données"
                nativeSelectProps={{
                  value: filters.source,
                  onChange: (e) => updateFilter("source", e.target.value),
                }}
              >
                {sources.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="fr-grid-row fr-grid-row--gutters fr-mt-2w">
            <div className="fr-col-12 fr-col-md-6">
              <Select
                label="Type d'acteur"
                nativeSelectProps={{
                  value: filters.typeActeur,
                  onChange: (e) => updateFilter("typeActeur", e.target.value),
                }}
              >
                {types.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="fr-col-12 fr-col-md-6">
              <Select
                label="Action proposée"
                nativeSelectProps={{
                  value: filters.action,
                  onChange: (e) => updateFilter("action", e.target.value),
                }}
              >
                {actions.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="fr-grid-row fr-grid-row--gutters fr-mt-2w">
            <div className="fr-col-12" style={{ position: "relative" }}>
              <Input
                label="Rechercher par EPCI"
                nativeInputProps={{
                  value: epciSearch,
                  onChange: (e) => {
                    setEpciSearch(e.target.value);
                    setShowEpciSuggestions(true);
                  },
                  onFocus: () => setShowEpciSuggestions(true),
                  placeholder:
                    "Ex: Métropole du Grand Paris, CA du Pays Basque...",
                  type: "text",
                }}
              />
              {showEpciSuggestions && epciSuggestions.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    backgroundColor: "white",
                    border: "1px solid var(--border-default-grey)",
                    borderRadius: "0.25rem",
                    maxHeight: "200px",
                    overflowY: "auto",
                    zIndex: 1000,
                    boxShadow: "var(--lifted-shadow)",
                  }}
                >
                  {epciSuggestions.map((epci) => (
                    <button
                      key={epci.code}
                      type="button"
                      onClick={() => handleEpciSelect(epci.code, epci.nom)}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "0.75rem 1rem",
                        border: "none",
                        backgroundColor: "transparent",
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "var(--background-contrast-grey)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <div>
                        <strong>{epci.nom}</strong>
                      </div>
                      <div style={{ fontSize: "0.875rem", color: "#666" }}>
                        Code: {epci.code}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="fr-grid-row fr-grid-row--gutters fr-mt-2w">
            <div className="fr-col-12">
              <div className="fr-btns-group fr-btns-group--inline">
                <Button
                  onClick={onSearch}
                  disabled={isSearching}
                  priority="primary"
                  size="small"
                >
                  {isSearching ? "Recherche..." : "Rechercher"}
                </Button>

                <Button
                  onClick={handleGetLocation}
                  disabled={isGettingLocation}
                  priority="secondary"
                  size="small"
                  iconId="fr-icon-map-pin-user-line"
                  title="Me localiser"
                >
                  {isGettingLocation ? "Localisation..." : "Me localiser"}
                </Button>

                {hasActiveFilters && (
                  <Button
                    onClick={resetFilters}
                    priority="secondary"
                    size="small"
                  >
                    Réinitialiser
                  </Button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
