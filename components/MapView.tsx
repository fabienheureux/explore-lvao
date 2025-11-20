"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Map, { Source, Layer, MapRef } from "react-map-gl/maplibre";
import type { LayerProps } from "react-map-gl/maplibre";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { Button } from "@codegouvfr/react-dsfr/Button";
import "maplibre-gl/dist/maplibre-gl.css";

interface MapViewProps {
  data: any[];
  onMarkerClick?: (latitude: number, longitude: number) => void;
  mapRef?: any;
  onMapMove?: () => void;
  isSpatialMode?: boolean;
  onMarkerHover?: (actor: any | null) => void;
}

const actorModal = createModal({
  id: "actor-details-modal",
  isOpenedByDefault: false,
});

export function MapView({
  data,
  onMarkerClick,
  mapRef: externalMapRef,
  onMapMove,
  isSpatialMode = false,
  onMarkerHover,
}: MapViewProps) {
  const internalMapRef = useRef<MapRef>(null);
  const mapRef = externalMapRef || internalMapRef;
  const [selectedActor, setSelectedActor] = useState<any | null>(null);
  const [hoveredActor, setHoveredActor] = useState<any | null>(null);

  // Convert data to GeoJSON
  const geoJsonData = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        type: "FeatureCollection" as const,
        features: [],
      };
    }

    return {
      type: "FeatureCollection" as const,
      features: data
        .filter((item) => item.latitude && item.longitude)
        .map(({ latitude, longitude, ...properties }) => ({
          type: "Feature" as const,
          geometry: {
            type: "Point" as const,
            coordinates: [Number(longitude), Number(latitude)],
          },
          properties,
        })),
    };
  }, [data]);

  // Simple circle layer for all points
  const pointsLayer: LayerProps = {
    id: "actors-points",
    type: "circle",
    source: "actors",
    paint: {
      "circle-color": "#11b4da",
      "circle-radius": 4,
      "circle-stroke-width": 1,
      "circle-stroke-color": "#fff",
      "circle-opacity": 0.8,
    },
  };

  const handleMapClick = (event: any) => {
    const features = event.features;
    if (!features || features.length === 0) return;

    const feature = features[0];
    const { latitude, longitude, ...properties } = feature.properties;

    // Set the selected actor with all properties
    setSelectedActor({
      latitude: feature.geometry.coordinates[1],
      longitude: feature.geometry.coordinates[0],
      ...properties,
    });

    // Open the modal
    actorModal.open();

    // Callback for parent component to fetch full details
    if (onMarkerClick) {
      onMarkerClick(
        feature.geometry.coordinates[1],
        feature.geometry.coordinates[0],
      );
    }
  };

  const handleMapMouseMove = (event: any) => {
    const features = event.features;
    if (!features || features.length === 0) {
      setHoveredActor(null);
      if (onMarkerHover) {
        onMarkerHover(null);
      }
      return;
    }

    const feature = features[0];
    const { latitude, longitude, ...properties } = feature.properties;

    const actor = {
      latitude: feature.geometry.coordinates[1],
      longitude: feature.geometry.coordinates[0],
      ...properties,
    };

    setHoveredActor(actor);
    if (onMarkerHover) {
      onMarkerHover(actor);
    }
  };

  const handleMapMouseLeave = () => {
    setHoveredActor(null);
    if (onMarkerHover) {
      onMarkerHover(null);
    }
  };

  // Auto-fit bounds when data changes (only if not in spatial mode)
  useEffect(() => {
    if (!mapRef.current || !geoJsonData.features.length || isSpatialMode)
      return;

    const coordinates = geoJsonData.features.map(
      (feature) => feature.geometry.coordinates,
    );

    // Calculate bounds
    const lngs = coordinates.map((coord) => coord[0]);
    const lats = coordinates.map((coord) => coord[1]);

    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);

    // Fit bounds with padding
    mapRef.current.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      {
        padding: 50,
        maxZoom: 15,
        duration: 1000,
      },
    );
  }, [geoJsonData, isSpatialMode]);

  return (
    <div className="relative h-screen w-screen">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: -0.5632,
          latitude: 47.4784,
          zoom: 9,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
        interactiveLayerIds={["actors-points"]}
        onClick={handleMapClick}
        onMouseMove={handleMapMouseMove}
        onMouseLeave={handleMapMouseLeave}
        cursor="pointer"
        onMoveEnd={isSpatialMode && onMapMove ? onMapMove : undefined}
      >
        <Source id="actors" type="geojson" data={geoJsonData} />
        <Layer {...pointsLayer} />
      </Map>

      {/* Results counter */}
      <div className="fixed bottom-4 right-4 bg-white px-6 py-3 rounded-lg shadow-lg border border-gray-200">
        <span className="text-sm font-medium text-gray-700">
          {geoJsonData.features.length.toLocaleString("fr-FR")} résultats
        </span>
      </div>

      <actorModal.Component
        title={selectedActor?.nom || "Détails de l'acteur"}
        size="large"
      >
        {selectedActor && (
          <>
            <div className="fr-btns-group fr-btns-group--inline fr-mb-3w fr-mt-1w">
              {/* SIRET Link */}
              {selectedActor.siret && (
                <Button
                  iconId="fr-icon-building-line"
                  priority="secondary"
                  linkProps={{
                    href: `https://annuaire-entreprises.data.gouv.fr/etablissement/${selectedActor.siret}`,
                    target: "_blank",
                    rel: "noopener noreferrer",
                  }}
                >
                  Annuaire entreprise (SIRET)
                </Button>
              )}

              {/* SIREN Links */}
              {selectedActor.siren && (
                <>
                  <Button
                    iconId="fr-icon-building-line"
                    priority="secondary"
                    linkProps={{
                      href: `https://annuaire-entreprises.data.gouv.fr/entreprise/${selectedActor.siren}`,
                      target: "_blank",
                      rel: "noopener noreferrer",
                    }}
                  >
                    Annuaire Entreprise (SIREN)
                  </Button>

                  <Button
                    iconId="fr-icon-external-link-line"
                    priority="secondary"
                    linkProps={{
                      href: `https://www.societe.ninja/data.html?siren=${selectedActor.siren}`,
                      target: "_blank",
                      rel: "noopener noreferrer",
                    }}
                  >
                    Societe.ninja
                  </Button>
                </>
              )}

              {/* MAP LINKS */}
              {selectedActor.latitude && selectedActor.longitude && (
                <>
                  <Button
                    iconId="fr-icon-map-pin-2-line"
                    priority="secondary"
                    linkProps={{
                      href: `https://www.google.com/maps?q=${selectedActor.latitude},${selectedActor.longitude}`,
                      target: "_blank",
                      rel: "noopener noreferrer",
                    }}
                  >
                    Google Maps
                  </Button>

                  <Button
                    iconId="fr-icon-map-pin-2-line"
                    priority="secondary"
                    linkProps={{
                      href: `https://www.openstreetmap.org/?mlat=${selectedActor.latitude}&mlon=${selectedActor.longitude}&zoom=16`,
                      target: "_blank",
                      rel: "noopener noreferrer",
                    }}
                  >
                    OpenStreetMap
                  </Button>
                </>
              )}
            </div>

            <div>
              <div className="fr-grid-row fr-grid-row--gutters">
                <div className="fr-col-12">
                  <h4 className="fr-h6">Informations générales</h4>
                  {selectedActor.nom && (
                    <p>
                      <strong>Nom :</strong> {selectedActor.nom}
                    </p>
                  )}
                  {selectedActor.adresse && (
                    <p>
                      <strong>Adresse :</strong> {selectedActor.adresse}
                    </p>
                  )}
                  {selectedActor.code_postal && (
                    <p>
                      <strong>Code postal :</strong> {selectedActor.code_postal}
                    </p>
                  )}
                  {selectedActor.ville && (
                    <p>
                      <strong>Ville :</strong> {selectedActor.ville}
                    </p>
                  )}
                  {selectedActor.type_dacteur && (
                    <p>
                      <strong>Type d'acteur :</strong>{" "}
                      {selectedActor.type_dacteur}
                    </p>
                  )}
                </div>

                {(selectedActor.latitude || selectedActor.longitude) && (
                  <div className="fr-col-12 fr-mt-2w">
                    <h4 className="fr-h6">Localisation</h4>
                    <p>
                      <strong>Latitude :</strong> {selectedActor.latitude}
                    </p>
                    <p>
                      <strong>Longitude :</strong> {selectedActor.longitude}
                    </p>
                  </div>
                )}

                {selectedActor.paternite && (
                  <div className="fr-col-12 fr-mt-2w">
                    <h4 className="fr-h6">Source</h4>
                    <p>{selectedActor.paternite}</p>
                  </div>
                )}

                <div className="fr-col-12 fr-mt-3w">
                  <h4 className="fr-h6">Toutes les données</h4>
                  <pre
                    style={{
                      backgroundColor: "var(--background-contrast-grey)",
                      padding: "1rem",
                      borderRadius: "0.25rem",
                      overflow: "auto",
                      fontSize: "0.875rem",
                    }}
                  >
                    {JSON.stringify(selectedActor, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </>
        )}
      </actorModal.Component>
    </div>
  );
}
