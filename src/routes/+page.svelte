<script lang="ts">
	export let data;
	import { instantiateDuckDb } from '$lib/duckdb';
	import Results from '$lib/components/speech.svelte';
	import Spinner from '$lib/components/Spinner.svelte';
	import { base } from '$app/paths';

	async function load_db() {
		const db = await instantiateDuckDb();

		for (let i = 1; i <= 5; i++) {
			const filename = `acteurs_part_${i}.csv`
		  await db.registerFileURL(filename, `${base}/${filename}`, 4, false);
		}

		const conn = await db.connect();
		await conn.query(`
			LOAD spatial;
			CREATE TABLE acteurs AS SELECT * FROM read_csv_auto('acteurs*.csv');
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
	<Results {results} />
{/await}

<style>
	@import "../styles.css";
</style>
