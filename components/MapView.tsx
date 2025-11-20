"use client";

import { useMemo, useRef } from "react";
import Map, { Source, Layer, MapRef } from "react-map-gl/maplibre";
import type { LayerProps } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

interface MapViewProps {
  data: any[];
}

export function MapView({ data }: MapViewProps) {
  const mapRef = useRef<MapRef>(null);

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

  return (
    <div className="relative h-screen w-screen">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: -2,
          latitude: 48,
          zoom: 6,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
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
    </div>
  );
}
