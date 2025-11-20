# Deployment Guide

## Custom Domain Configuration

This application is configured to be deployed at:
**https://quefairedemesobjets.fabien.cool**

## Deployment Steps

### 1. Ensure GitHub Pages is Enabled

1. Go to your repository settings: `https://github.com/fabienheureux/explore-lvao/settings/pages`
2. Under "Build and deployment":
   - Source: **GitHub Actions**
3. Custom domain should be set to: `quefairedemesobjets.fabien.cool`
4. Enable "Enforce HTTPS"

### 2. Push to GitHub

```bash
git add .
git commit -m "Migrate to Next.js with DuckDB-WASM"
git push origin main
```

### 3. Monitor Deployment

1. Go to the Actions tab: `https://github.com/fabienheureux/explore-lvao/actions`
2. Watch the "Deploy Next.js to GitHub Pages" workflow
3. Once complete (green checkmark), visit: `https://quefairedemesobjets.fabien.cool`

## What's Deployed

- **Static Next.js application** exported to the `out/` directory
- **CNAME file** for custom domain configuration
- **.nojekyll file** to prevent Jekyll processing
- **All assets** including the compiled JavaScript bundles

## How It Works

1. GitHub Actions runs on every push to `main`
2. Installs dependencies (`npm ci`)
3. Builds the Next.js app (`npm run build`)
4. Uploads the `out/` directory as a Pages artifact
5. Deploys to GitHub Pages

## Local Testing

Before deploying, you can test locally:

```bash
# Development server
npm run dev
# Visit http://localhost:3000

# Production build
npm run build
npx serve out
# Visit http://localhost:3000
```

## Troubleshooting

### 404 Error
- **Check basePath**: For custom domains, basePath should be empty (current config is correct)
- **Verify CNAME**: Ensure `public/CNAME` contains `quefairedemesobjets.fabien.cool`
- **DNS Settings**: Verify your DNS records point to GitHub Pages

### Dataset Loading Issues
- The app downloads ~50MB CSV from data.ademe.fr on first load
- This is normal and happens in the browser
- Check browser console for any CORS or network errors

### Build Failures
- Check the Actions tab for error logs
- Common issues:
  - Node version mismatch (should be 20)
  - TypeScript errors (run `npm run build` locally first)
  - Missing dependencies (delete node_modules and reinstall)

## Performance Notes

- **Initial Load**: 5-15 seconds (downloading dataset)
- **Subsequent Queries**: < 100ms
- **Map Rendering**: Limited to 10,000 points for optimal performance
