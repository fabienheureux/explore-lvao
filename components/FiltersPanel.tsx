"use client";

import { useState } from "react";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Badge } from "@codegouvfr/react-dsfr/Badge";

export interface Filters {
  searchTerm: string;
  source: string;
  typeActeur: string;
  action: string;
}

interface FiltersPanelProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onSearch: () => void;
  isSearching: boolean;
  resultsCount: number;
}

const SOURCES = [
  { value: "", label: "Toutes les sources" },
  { value: "ADEME", label: "ADEME" },
  { value: "CITEO", label: "CITEO" },
  { value: "Bibliothèques", label: "Bibliothèques - Ministère de la culture" },
  { value: "CRAR", label: "CRAR" },
  { value: "Ecosystem", label: "Ecosystem" },
];

const TYPE_ACTEURS = [
  { value: "", label: "Tous les types" },
  { value: "ess", label: "ESS (Économie Sociale et Solidaire)" },
  { value: "pav_public", label: "Point d'apport volontaire public" },
  { value: "collectivite", label: "Collectivité" },
  { value: "commerce", label: "Commerce" },
];

const ACTIONS = [
  { value: "", label: "Toutes les actions" },
  { value: "reparer", label: "Réparer" },
  { value: "donner", label: "Donner" },
  { value: "emprunter", label: "Emprunter" },
  { value: "trier", label: "Trier" },
  { value: "revendre", label: "Revendre" },
  { value: "acheter", label: "Acheter" },
  { value: "echanger", label: "Échanger" },
  { value: "louer", label: "Louer" },
];

export function FiltersPanel({
  filters,
  onFiltersChange,
  onSearch,
  isSearching,
  resultsCount,
}: FiltersPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const updateFilter = (key: keyof Filters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    onFiltersChange({
      searchTerm: "",
      source: "",
      typeActeur: "",
      action: "",
    });
  };

  const hasActiveFilters =
    filters.searchTerm ||
    filters.source ||
    filters.typeActeur ||
    filters.action;

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
              <h1 className="fr-h3 fr-mb-2w">Longue Vie Aux Objets</h1>
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
                {SOURCES.map((s) => (
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
                {TYPE_ACTEURS.map((t) => (
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
                {ACTIONS.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="fr-grid-row fr-grid-row--gutters fr-mt-3w">
            <div className="fr-col-12">
              <div className="fr-btns-group fr-btns-group--inline">
                <Button
                  onClick={onSearch}
                  disabled={isSearching}
                  priority="primary"
                >
                  {isSearching ? "Recherche..." : "Rechercher"}
                </Button>

                {hasActiveFilters && (
                  <Button onClick={resetFilters} priority="secondary">
                    Réinitialiser les filtres
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
