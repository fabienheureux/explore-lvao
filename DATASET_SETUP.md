# Dataset Setup - Build-Time Download

## Overview

The ADEME dataset is now downloaded during the build process instead of at runtime, providing much faster loading times for users.

## How It Works

### 1. Build-Time Download

When you run `npm run build`, the following happens:

1. **Prebuild script** (`scripts/download-dataset.js`) runs automatically
2. Downloads the CSV from data.ademe.fr (~181 MB)
3. Saves it to `public/acteurs.csv`
4. Creates metadata file `public/dataset-metadata.json`
5. Next.js build includes the CSV in the static output

### 2. Runtime Loading

When users visit the site:

1. DuckDB-WASM initializes in the browser
2. Loads the CSV from the same origin (fast, no CORS issues)
3. Creates a SQL-queryable table
4. Ready for instant queries!

## Benefits

✅ **Much faster initial load** - CSV is served from the same domain as static asset  
✅ **No CORS issues** - No cross-origin requests  
✅ **Always up-to-date** - Daily scheduled rebuilds refresh the dataset  
✅ **Better caching** - Browsers can cache the CSV file  
✅ **Reliable** - No dependency on external API during user visits

## Scripts

### Download Dataset Manually

```bash
npm run download-dataset
```

Downloads the latest dataset from data.ademe.fr to `public/acteurs.csv`.

### Build (includes dataset download)

```bash
npm run build
```

Automatically downloads the dataset before building.

## Scheduled Updates

The GitHub Actions workflow is configured to:

- **Rebuild daily at 2 AM UTC** (via cron schedule)
- **Rebuild on every push to main**
- **Manual trigger available** (workflow_dispatch)

This ensures the dataset is automatically refreshed every day.

## File Locations

- **Download script**: `scripts/download-dataset.js`
- **Dataset output**: `public/acteurs.csv` (181 MB)
- **Metadata**: `public/dataset-metadata.json`
- **Workflow**: `.github/workflows/deploy.yml`

## Error Handling

The CSV loading includes error tolerance:

- `ignore_errors=true` - Skips malformed rows
- `null_padding=true` - Fills missing columns with NULL

This handles the occasional malformed line in the ADEME dataset.

## Dataset Metadata

The `dataset-metadata.json` file includes:

```json
{
  "downloadDate": "2025-11-20T19:53:34.087Z",
  "sourceUrl": "https://data.ademe.fr/.../acteurs.csv",
  "fileSize": 190138425
}
```

This allows you to track when the dataset was last updated.

## Troubleshooting

### Dataset not downloading during build

Check that Node.js has network access and can reach data.ademe.fr.

### Build fails with "file not found"

Run `npm run download-dataset` manually before building.

### Dataset is outdated

Trigger a manual rebuild via GitHub Actions or run locally:

```bash
npm run download-dataset
npm run build
git add public/acteurs.csv public/dataset-metadata.json
git commit -m "Update dataset"
git push
```
