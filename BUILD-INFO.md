# 📦 Informations de Build

## ✅ Build de Production Créé

Le dossier `dist/` contient la version optimisée de l'application prête pour le déploiement.

### Structure du Build

```
dist/
├── index.html              # Page HTML optimisée
└── assets/
    └── index-[hash].js     # JavaScript bundle minifié et optimisé
```

### Statistiques du Build

- **HTML** : ~4.33 kB (gzip: 1.63 kB)
- **JavaScript** : ~128.56 kB (gzip: 30.01 kB)
- **Total** : ~132.89 kB (gzip: 31.64 kB)

### Commandes Disponibles

```bash
# Créer le build de production
npm run build

# Prévisualiser le build localement
npm run preview

# Démarrer le serveur de développement
npm run dev
```

### Déploiement

Le dossier `dist/` est :
- ✅ Ignoré par Git (dans `.gitignore`)
- ✅ Généré automatiquement par Vercel lors du déploiement
- ✅ Prêt pour être déployé sur Vercel ou tout autre serveur statique

### Note

⚠️ **Ne commitez JAMAIS le dossier `dist/`** dans Git. Il est automatiquement généré lors du build et sera recréé par Vercel à chaque déploiement.
