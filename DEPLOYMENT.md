# 🚀 Guide de Déploiement - GitHub & Vercel

## Étapes pour déployer la plateforme CERIP sur GitHub et Vercel

### 📋 Prérequis

- Compte GitHub
- Compte Vercel (connexion via GitHub)
- Git installé sur votre machine
- Node.js et npm installés

---

## 1️⃣ Initialiser le dépôt Git

```bash
# Initialiser git dans le projet
git init

# Vérifier le statut
git status

# Ajouter tous les fichiers
git add .

# Créer le premier commit
git commit -m "Initial commit - Plateforme CERIP L'IDÉATEUR"
```

---

## 2️⃣ Créer le dépôt sur GitHub

1. **Aller sur GitHub.com** et se connecter
2. Cliquer sur le bouton **"+"** en haut à droite → **"New repository"**
3. Remplir le formulaire :
   - **Repository name** : `cerip-ideateur` (ou le nom de votre choix)
   - **Description** : `Plateforme d'Incubation et de Formation Entrepreneuriale - CERIP`
   - **Visibilité** : Public ou Private (selon votre choix)
   - **⚠️ IMPORTANT** : Ne PAS cocher :
     - ❌ Add a README file
     - ❌ Add .gitignore
     - ❌ Choose a license
   (Ces fichiers existent déjà dans votre projet)
4. Cliquer sur **"Create repository"**
5. **Copier l'URL du dépôt** affichée (ex: `https://github.com/votre-username/cerip-ideateur.git`)

---

## 3️⃣ Connecter le projet local à GitHub

```bash
# Ajouter le remote GitHub
git remote add origin https://github.com/votre-username/cerip-ideateur.git

# Renommer la branche principale en 'main' (standard GitHub)
git branch -M main

# Pousser le code sur GitHub
git push -u origin main
```

Si GitHub demande une authentification :
- Utilisez un **Personal Access Token** (PAT) au lieu du mot de passe
- Créer un PAT : GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token

---

## 4️⃣ Déployer sur Vercel

### Option A : Via l'interface Vercel (Recommandé)

1. **Aller sur [vercel.com](https://vercel.com)**
2. Cliquer sur **"Sign Up"** ou **"Log In"**
3. Se connecter avec votre compte **GitHub**
4. Cliquer sur **"Add New Project"**
5. Dans la liste des dépôts, trouver et sélectionner **`cerip-ideateur`**
6. Cliquer sur **"Import"**

### Configuration du projet sur Vercel

Vercel détectera automatiquement que c'est un projet Vite, mais vérifiez ces paramètres :

- **Framework Preset** : `Vite`
- **Root Directory** : `./` (par défaut)
- **Build Command** : `npm run build`
- **Output Directory** : `dist`
- **Install Command** : `npm install`

7. Cliquer sur **"Deploy"**

### Option B : Via Vercel CLI

```bash
# Installer Vercel CLI globalement
npm install -g vercel

# Dans le dossier du projet, lancer
vercel

# Suivre les instructions interactives
# - Link to existing project? No (première fois)
# - Project name: cerip-ideateur
# - Directory: ./
# - Build command: npm run build
# - Output directory: dist
```

---

## 5️⃣ Configuration post-déploiement

### Variables d'environnement (si nécessaire)

Si vous utilisez Supabase ou d'autres services nécessitant des clés API :

1. Aller sur **Vercel Dashboard** → Votre projet
2. **Settings** → **Environment Variables**
3. Ajouter les variables :
   - `VITE_SUPABASE_URL` (si utilisé)
   - `VITE_SUPABASE_ANON_KEY` (si utilisé)
   - Autres variables nécessaires

### Domaine personnalisé (optionnel)

1. Vercel Dashboard → Votre projet → **Settings** → **Domains**
2. Ajouter votre domaine personnalisé
3. Suivre les instructions DNS

---

## 6️⃣ Déploiement automatique

Une fois connecté à GitHub, Vercel déploiera automatiquement :
- ✅ À chaque push sur la branche `main`
- ✅ À chaque Pull Request (prévisualisation)
- ✅ Rebuild automatique en cas de mise à jour des dépendances

---

## 🔄 Workflow de développement

```bash
# 1. Faire des modifications dans le code
# ... éditer les fichiers ...

# 2. Vérifier les changements
git status

# 3. Ajouter les fichiers modifiés
git add .

# 4. Créer un commit
git commit -m "Description des modifications"

# 5. Pousser sur GitHub
git push

# 6. Vercel déploiera automatiquement ! 🚀
```

---

## 📝 Commandes Git utiles

```bash
# Voir l'historique des commits
git log

# Voir les changements non commités
git diff

# Créer une nouvelle branche
git checkout -b nom-de-la-branche

# Revenir à la branche main
git checkout main

# Fusionner une branche
git merge nom-de-la-branche
```

---

## ⚠️ Problèmes courants

### Erreur : "repository not found"
- Vérifier l'URL du remote : `git remote -v`
- Vérifier que le dépôt GitHub existe et que vous y avez accès

### Erreur : "Permission denied"
- Vérifier votre authentification GitHub
- Utiliser un Personal Access Token

### Erreur de build sur Vercel
- Vérifier les logs dans Vercel Dashboard → Deployments
- S'assurer que `package.json` contient bien le script `build`
- Vérifier que tous les fichiers nécessaires sont commités

### Le site ne se met pas à jour
- Vérifier que le push GitHub a réussi
- Attendre quelques secondes (déploiement automatique)
- Vérifier dans Vercel Dashboard qu'un nouveau déploiement a été déclenché

---

## 🎉 C'est fait !

Une fois déployé, votre plateforme sera accessible sur :
- URL Vercel : `https://cerip-ideateur.vercel.app` (ou similaire)
- Vous pouvez partager cette URL avec vos utilisateurs !

---

## 📞 Support

Pour toute question sur le déploiement :
- Documentation Vercel : https://vercel.com/docs
- Documentation GitHub : https://docs.github.com
- Documentation Vite : https://vitejs.dev
