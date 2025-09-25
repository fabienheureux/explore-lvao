<script lang="ts">
	export let data;
	import { instantiateDuckDb } from '$lib/duckdb';
	import Speech from '$lib/components/speech.svelte';
	import Spinner from '$lib/components/Spinner.svelte';
	import { base } from '$app/paths';

	async function load_db() {
		console.log('LOADING DB');
		// A simple case of a db of a single parquet file.
		const db = await instantiateDuckDb();
		await db.registerFileURL('acteurs.csv', `${base}/acteurs_part_1.csv`, 4, false);
		const conn = await db.connect();
		await conn.query(`
			LOAD spatial;
			CREATE TABLE acteurs AS SELECT * FROM 'acteurs.csv';
		`);
		return conn;
	}

	// Set up the db connection as an empty promise.
	const conn_prom = load_db();

	$: results = new Promise(() => {});

	async function getAll(latitude = 48, longitude = -2) {
		const conn = await conn_prom;
		results = conn.query(`
		SELECT
		  identifiant,
		  latitude,
		  longitude,
		  ST_Distance_Spheroid(
		    ST_Point(latitude, longitude),
		    ST_Point(${latitude}, ${longitude})
		  ) AS dist_meters
		FROM acteurs
		ORDER BY dist_meters ASC;`);
		const result = await results;
	}

	// Start with FDR, because he's good.
	conn_prom.then(() => getAll());
</script>

{#await results}
	<Spinner></Spinner>
{:then result}
	<Speech {results} />
{/await}

<style>
	@import "../styles.css";
</style>
