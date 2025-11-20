#!/usr/bin/env node

/**
 * Download the ADEME dataset and save it to the public directory
 * This script runs during the build process
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const DATASET_URL = 'https://data.ademe.fr/data-fair/api/v1/datasets/wvw1zecq4f4gyvonve5j0hr7/data-files/acteurs.csv';
const OUTPUT_DIR = path.join(__dirname, '../public');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'acteurs.csv');

// Ensure public directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('📥 Téléchargement du dataset ADEME...');
console.log(`📍 Source: ${DATASET_URL}`);
console.log(`📁 Destination: ${OUTPUT_FILE}`);

const file = fs.createWriteStream(OUTPUT_FILE);
let downloadedBytes = 0;
let totalBytes = 0;

https.get(DATASET_URL, (response) => {
  if (response.statusCode !== 200) {
    console.error(`❌ Erreur HTTP: ${response.statusCode}`);
    process.exit(1);
  }

  totalBytes = parseInt(response.headers['content-length'] || '0', 10);
  console.log(`📦 Taille totale: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);

  response.on('data', (chunk) => {
    downloadedBytes += chunk.length;
    const progress = ((downloadedBytes / totalBytes) * 100).toFixed(1);
    process.stdout.write(`\r⏳ Progression: ${progress}% (${(downloadedBytes / 1024 / 1024).toFixed(2)} MB / ${(totalBytes / 1024 / 1024).toFixed(2)} MB)`);
  });

  response.pipe(file);

  file.on('finish', () => {
    file.close();
    console.log('\n✅ Dataset téléchargé avec succès!');
    console.log(`📊 Taille finale: ${(fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(2)} MB`);

    // Add metadata file
    const metadata = {
      downloadDate: new Date().toISOString(),
      sourceUrl: DATASET_URL,
      fileSize: fs.statSync(OUTPUT_FILE).size,
    };
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'dataset-metadata.json'),
      JSON.stringify(metadata, null, 2)
    );
    console.log('📝 Métadonnées sauvegardées');
  });
}).on('error', (err) => {
  fs.unlinkSync(OUTPUT_FILE);
  console.error(`\n❌ Erreur lors du téléchargement: ${err.message}`);
  process.exit(1);
});
