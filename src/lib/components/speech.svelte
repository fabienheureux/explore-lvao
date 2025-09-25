<script lang="ts">
  import { CircleLayer, GeoJSONSource, MapLibre, Marker } from 'svelte-maplibre-gl';
  export let results: Promise<any[]>; 
  let geoJsonData;

  // when the promise resolves, populate geoJsonData
  $: (async () => {
    const values = await results;
    geoJsonData = {
      type: "FeatureCollection",
      features: values.toArray().map(({ latitude, longitude }) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [longitude, latitude]
        },
        properties: {}
      }))
    };
  })();
</script>

<MapLibre
  class="h-screen w-screen"
  zoom={6}
  center={[-2,48]}
  style="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
>
    <GeoJSONSource data={geoJsonData}>
      <CircleLayer
        paint={{
          'circle-color': '#f28cb1',
          'circle-radius': ['+', 10, ['sqrt', ['get', 'point_count']]],
          'circle-opacity': 0.8
        }}
      />
    </GeoJSONSource>
</MapLibre>

<div class="p-2  rounded-full shadow-xl bg-white/75 ring fixed bottom-10 right-10">
  {geoJsonData?.features.length} résultats
</div>
