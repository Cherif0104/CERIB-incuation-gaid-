# L'IDÉATEUR - Plateforme d'Incubation et de Formation Entrepreneuriale

Application web gamifiée pour accompagner les entrepreneurs, entreprises et professionnels dans leur développement. Plateforme d'incubation avec diagnostic personnalisé, missions structurées et système de certification.

## 🌐 Déploiement

### GitHub & Vercel

Le projet est déployé sur Vercel et lié à un dépôt GitHub pour le déploiement automatique.

**URL de production** : [À configurer sur Vercel]

### Déploiement Local

Application web éducative pour transformer votre idée en projet entrepreneurial concret à travers 6 missions stratégiques.

## 🚀 Installation et Démarrage

### Prérequis

- Node.js 18+ et npm

### Installation

1. **Installer les dépendances**

```bash
npm install
```

2. **Démarrage du serveur de développement**

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:7000`

Le navigateur s'ouvrira automatiquement.

## 📁 Structure du Projet

```
.
├── index.html          # Point d'entrée principal
├── src/                # (À venir)
├── package.json
├── vite.config.js
└── README.md
```

## 🔧 Scripts Disponibles

- `npm run dev` - Lance le serveur de développement
- `npm run build` - Construit l'application pour la production
- `npm run preview` - Prévisualise la version de production

## 🎯 Fonctionnalités

- **Parcours structuré** : 6 missions pour transformer votre idée
- **Interface moderne** : Design épuré avec Tailwind CSS
- **Gamification** : Système de XP et de niveaux
- **Navigation intuitive** : Sidebar avec accès rapide aux missions

## 🚀 Déploiement sur GitHub et Vercel

### 1. Initialiser Git (si pas déjà fait)

```bash
git init
git add .
git commit -m "Initial commit - Plateforme CERIP L'IDÉATEUR"
```

### 2. Créer le dépôt sur GitHub

1. Aller sur [GitHub](https://github.com) et créer un nouveau dépôt
2. Ne PAS initialiser avec README, .gitignore ou license (déjà présents)
3. Copier l'URL du dépôt (ex: `https://github.com/votre-username/cerip-ideateur.git`)

### 3. Pousser le code sur GitHub

```bash
git remote add origin https://github.com/votre-username/cerip-ideateur.git
git branch -M main
git push -u origin main
```

### 4. Connecter à Vercel

1. Aller sur [Vercel](https://vercel.com)
2. Se connecter avec votre compte GitHub
3. Cliquer sur "Add New Project"
4. Importer le dépôt GitHub créé
5. Vercel détectera automatiquement Vite
6. Configuration recommandée :
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
7. Cliquer sur "Deploy"
8. Le site sera accessible sur une URL Vercel (ex: `cerip-ideateur.vercel.app`)

### 5. Variables d'environnement (si nécessaire)

Si vous utilisez Supabase ou d'autres services, ajoutez les variables dans :
- Vercel Dashboard → Project → Settings → Environment Variables

## 📝 Notes

Cette version est une base propre et fonctionnelle. Les fonctionnalités avancées seront ajoutées progressivement.

## 🏗️ Architecture

- **Frontend**: Vanilla JavaScript (ES6 Modules)
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Déploiement**: Vercel
- **Version Control**: Git/GitHub
