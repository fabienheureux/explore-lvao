# Que Faire de Mes Bidules - Carte Interactive

Application Next.js pour explorer interactivement les acteurs de la réparation et du réemploi en France.

## 🚀 Technologies

- **Next.js 15** avec App Router et Turbopack
- **DuckDB-WASM** pour l'exécution de requêtes SQL dans le navigateur
- **React Map GL** avec MapLibre pour la visualisation cartographique
- **TypeScript** pour la sûreté du typage
- **Tailwind CSS** pour le style

## 📦 Installation

```bash
npm install
```

## 🛠️ Développement

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 🏗️ Build de production

```bash
npm run build
```

Génère un export statique dans le dossier `out/`.

## 📊 Fonctionnalités

### Chargement efficace des données
- Télécharge automatiquement le dataset complet (~50MB) depuis data.ademe.fr
- Charge les données dans DuckDB-WASM pour des requêtes instantanées
- Le chargement initial peut prendre quelques secondes, mais ensuite tout est rapide

### Requêtes SQL en temps réel
- Utilise DuckDB-WASM pour exécuter des requêtes SQL directement dans le navigateur
- Pas de serveur backend nécessaire
- Performances optimales grâce à l'indexation en mémoire

### Visualisation cartographique
- Affichage en temps réel des résultats sur une carte interactive
- Mise à jour instantanée lors de la recherche
- Support de milliers de points simultanément

### Recherche
- Filtrage par nom d'acteur
- Résultats instantanés
- Limite de 10 000 résultats pour l'affichage cartographique (performances)

## 🗺️ Architecture

### Structure du projet

```
explore-lvao/
├── app/
│   ├── layout.tsx          # Layout racine
│   ├── page.tsx             # Page principale avec recherche
│   └── globals.css          # Styles globaux
├── components/
│   └── MapView.tsx          # Composant carte MapLibre
├── hooks/
│   └── useDuckDB.ts         # Hook pour gestion DuckDB
├── lib/
│   └── duckdb.ts            # Utilitaires DuckDB-WASM
└── public/
    └── .nojekyll            # Pour GitHub Pages
```

### DuckDB Integration

Le fichier `lib/duckdb.ts` initialise DuckDB-WASM en utilisant les bundles CDN (jsdelivr) pour éviter les problèmes de bundling avec Webpack/Turbopack.

**Flux de chargement :**
1. Instantiation de DuckDB-WASM au premier rendu
2. Téléchargement du CSV depuis l'API ADEME
3. Enregistrement du fichier dans DuckDB
4. Création de la table avec extension spatiale
5. Connexion prête pour les requêtes

### Données

**Source :** [ADEME - Base Que Faire de Mes Bidules](https://data.ademe.fr/data-fair/api/v1/datasets/wvw1zecq4f4gyvonve5j0hr7/data-files/acteurs.csv)

Le dataset contient des informations sur :
- Points de collecte (PAV)
- Repair cafés
- Ressourceries et recycleries
- Ateliers de réparation
- Bibliothèques et médiathèques
- Acteurs de l'économie circulaire

**Colonnes principales :**
- `identifiant` : ID unique
- `nom` : Nom de l'acteur
- `latitude` / `longitude` : Coordonnées GPS
- `adresse`, `code_postal`, `ville` : Localisation
- `type_dacteur` : Type (ess, pav_public, collectivite, etc.)
- `propositions_de_services` : Services proposés (JSON)

## 🚀 Déploiement GitHub Pages

L'application est configurée pour être déployée automatiquement sur GitHub Pages.

### Configuration

1. **Activer GitHub Pages** dans les paramètres du repository :
   - Settings → Pages
   - Source : GitHub Actions

2. **Pousser sur main** :
   ```bash
   git push origin main
   ```

3. Le workflow `.github/workflows/deploy.yml` build et déploie automatiquement

### Base Path

L'application est configurée avec `basePath: '/explore-lvao'` dans `next.config.ts`. 
Si votre repo a un nom différent, modifiez cette valeur.

## 🔧 Configuration

### Next.js Config (`next.config.ts`)

```typescript
{
  output: 'export',           // Export statique
  basePath: '/explore-lvao',  // Chemin de base pour GitHub Pages
  images: { unoptimized: true }, // Images non optimisées pour export statique
  turbopack: {},              // Support Turbopack
}
```

### Variables d'environnement

Aucune variable d'environnement requise. L'URL du dataset est codée en dur dans `hooks/useDuckDB.ts`.

## 📝 Notes techniques

### Performance

- **Chargement initial** : 5-15 secondes (téléchargement CSV ~50MB)
- **Requêtes SQL** : < 100ms pour la plupart des requêtes
- **Rendu carte** : Limité à 10 000 points pour des performances optimales
- **Mémoire** : ~150-200 MB utilisés par DuckDB-WASM

### Limitations

- Le dataset complet est téléchargé à chaque session (pas de cache persistant)
- Fonctionne uniquement côté client (nécessite JavaScript)
- Pas de support pour les navigateurs très anciens (nécessite WebAssembly)

### Sécurité

L'input utilisateur est échappé (apostrophes doublées) pour prévenir les injections SQL basiques. Pour une sécurité renforcée en production, envisager l'utilisation de requêtes paramétrées si DuckDB-WASM les supporte.

## 🔍 Développement

### Ajouter une nouvelle fonctionnalité de recherche

Modifier `hooks/useDuckDB.ts` et ajouter une nouvelle fonction :

```typescript
export function useDuckDB() {
  // ... existing code
  
  const searchByCity = useCallback(async (city: string) => {
    if (!connection) return [];
    const sanitized = city.replace(/'/g, "''");
    return executeQuery(`SELECT * FROM acteurs WHERE ville LIKE '%${sanitized}%' LIMIT 10000;`);
  }, [connection, executeQuery]);
  
  return { /* ... */ searchByCity };
}
```

### Modifier la visualisation de la carte

Éditer `components/MapView.tsx` pour personnaliser les styles de la carte ou ajouter des layers.

## 📄 Licence

Ce projet utilise des données publiques de l'ADEME.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.
