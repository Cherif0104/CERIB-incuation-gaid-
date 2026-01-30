# CERIP Sénégal – Plateforme d'incubation

Plateforme d'apprentissage pédagogique et moderne pour l'incubation (CERIP Sénégal). Interface raffinée, charte graphique CERIP (logo vert & magenta), Desktop First & Mobile First.

**Dépôt GitHub :** [Cherif0104/CERIB-incuation-gaid-](https://github.com/Cherif0104/CERIB-incuation-gaid-.git)

## Structure

```
CERIP INCUBATION/
├── index.html       # Point d’entrée (charge CSS + scripts)
├── css/
│   └── app.css      # Thèmes, grille, BMC, composants
├── js/
│   ├── data.js      # INITIAL_MODULES, INITIAL_USERS
│   └── app.jsx      # React : Login, Admin/Coach, Incubé, BMC
└── README.md
```

## Lancer l’app

Les scripts sont chargés en externe et Babel compile le JSX. Il faut un **serveur HTTP local** (pas d’ouverture directe de `index.html` en `file://`).

Exemples :

```bash
# Node (npx serve)
npx serve .

# Python 3
python -m http.server 8000
```

Puis ouvrir : `http://localhost:3000` (serve) ou `http://localhost:8000` (Python).

## Comptes de test

| Rôle   | Email            | Mot de passe |
|--------|------------------|--------------|
| Admin  | admin@gainde.sn  | admin        |
| Coach  | coach@gainde.sn  | coach        |
| Incubé | user@gainde.sn   | user         |

## Données

- **Utilisateurs** : `localStorage` → clé `ga_users_v91`
- **Modules / parcours** : `localStorage` → clé `ga_master_v91`

Pas de base de données ni de back-end pour l’instant.
