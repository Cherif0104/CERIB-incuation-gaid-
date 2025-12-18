# 🔗 Configuration GitHub - IDEATEUR-CERIP

## ✅ Dépôt GitHub Identifié

**URL du dépôt** : https://github.com/Cherif0104/IDEATEUR-CERIP.git

## 📋 Commandes pour Connecter le Projet

### 1. Initialiser Git (si pas déjà fait)

```bash
git init
```

### 2. Ajouter tous les fichiers

```bash
git add .
```

### 3. Créer le premier commit

```bash
git commit -m "Initial commit - Plateforme CERIP L'IDÉATEUR"
```

### 4. Connecter au dépôt GitHub

```bash
git remote add origin https://github.com/Cherif0104/IDEATEUR-CERIP.git
```

### 5. Vérifier la connexion

```bash
git remote -v
```

Vous devriez voir :
```
origin  https://github.com/Cherif0104/IDEATEUR-CERIP.git (fetch)
origin  https://github.com/Cherif0104/IDEATEUR-CERIP.git (push)
```

### 6. Renommer la branche en 'main' (standard GitHub)

```bash
git branch -M main
```

### 7. Pousser le code sur GitHub

```bash
git push -u origin main
```

---

## 🔐 Authentification GitHub

Si GitHub demande une authentification :

### Option 1 : Personal Access Token (Recommandé)

1. Aller sur GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Cliquer sur "Generate new token (classic)"
3. Donner un nom (ex: "IDEATEUR-CERIP")
4. Sélectionner les scopes : `repo` (tout cocher sous repo)
5. Cliquer sur "Generate token"
6. **Copier le token** (il ne sera affiché qu'une fois !)
7. Utiliser ce token comme mot de passe lors du `git push`

### Option 2 : GitHub CLI

```bash
# Installer GitHub CLI
# Puis authentifier
gh auth login
```

---

## ✅ Vérification

Après le push, vérifiez sur :
https://github.com/Cherif0104/IDEATEUR-CERIP

Vous devriez voir tous vos fichiers dans le dépôt.

---

## 🚀 Après le Push sur GitHub

Une fois le code sur GitHub, vous pouvez :
1. Aller sur [Vercel.com](https://vercel.com)
2. Se connecter avec GitHub
3. Importer le dépôt `Cherif0104/IDEATEUR-CERIP`
4. Vercel détectera automatiquement Vite
5. Cliquer sur "Deploy"

Vercel déploiera automatiquement et vous donnera une URL !

---

## 🔄 Workflow Futur

Pour mettre à jour le code :

```bash
# 1. Faire vos modifications
# 2. Ajouter les changements
git add .

# 3. Commit
git commit -m "Description des modifications"

# 4. Push
git push

# 5. Vercel déploiera automatiquement ! 🎉
```
