# Priorités et hiérarchie — Savana

## Hiérarchie des rôles

Ordre d’autorité (du plus large au plus ciblé) :

1. **Super Admin** — Vue globale : organisations, quotas, suspension.
2. **Admin Org** — Gestion de son organisation : incubés, codes d’invitation, promotions, coachs, matrixage, modules pédagogiques.
3. **Coach** — Mes incubés : suivi, validation du parcours (Clé 1).
4. **Certificateur** — Sessions de certification et banque de questions (Clé 2).
5. **Incubé** — Parcours gamifié : modules, quiz, demande de coaching, examen.

Chaque rôle reste dans son périmètre (pas d’escalade). Les routes et menus sont définis en conséquence dans l’app.

**Note :** En base, le rôle stocké dans `staff_users` est l’un de : `SUPER_ADMIN`, `ADMIN_ORG`, `COACH`, `CERTIFICATEUR`. Le rôle `ADMIN` n’existe pas en base ; l’application le traite comme un alias de `ADMIN_ORG` pour la redirection et le menu (compatibilité).

## Ordre des modules (priorité d’affichage)

L’ordre d’affichage du parcours pour les incubés est déterminé par le champ **`sort_order`** des `learning_modules` :

- **Où l’éditer :** Admin Org → Modules pédagogiques.
- **Champ « Ordre / Priorité »** dans le formulaire d’ajout et de modification (0 = premier).
- **Boutons Monter / Descendre** dans la liste pour réordonner rapidement.

Le déblocage de l’étape suivante pour l’incubé : un module **quiz** ne débloque le suivant que si la note est **≥ 70 %** (seuil métier CERIP).

## Priorités produit (rappel)

1. Ordre des modules fixé et éditable (Admin Org).
2. Hiérarchie des rôles documentée et respectée dans l’app.
3. (Optionnel plus tard) Réordonnancement des questions de quiz dans l’éditeur.
