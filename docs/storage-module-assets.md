# Storage : bucket module-assets

Pour les documents (PDF, etc.) attachés aux modules pédagogiques, créer un bucket Supabase privé.

## 1. Création du bucket (Supabase Dashboard > Storage)

- **Nom** : `module-assets`
- **Public** : non (privé)
- **Allowed MIME types** : optionnel, ex. `application/pdf`, `image/*`

## 2. Policies Storage (Storage > Policies)

Les policies Supabase Storage utilisent `storage.objects`. L’app envoie le JWT avec le rôle (app_admin_org, app_incube, etc.) via RLS sur les tables ; pour Storage, on peut restreindre par `bucket_id` et par chemin.

### Upload (INSERT) – Admin Org uniquement

- **Name** : `Admin Org can upload module assets`
- **Allowed operation(s)** : INSERT
- **Target roles** : authenticated
- **Policy definition** (expression) :  
  `bucket_id = 'module-assets'`  
  et (en pratique) l’upload sera fait côté app avec le client Supabase après vérification que le module appartient à l’org de l’admin. Pour une policy stricte côté Storage sans table, on peut utiliser un dossier par org, ex. `{organisation_id}/{module_id}/{filename}` et vérifier que `auth.uid()` appartient à un `staff_users` dont `organisation_id` correspond au premier segment du chemin. Exemple simplifié :  
  `bucket_id = 'module-assets'`  
  (la vérification fine module/org reste côté app avant d’appeler `storage.from('module-assets').upload(...)`).

### Lecture (SELECT) – utilisateurs authentifiés ayant accès au module

La lecture des fichiers se fait via **signed URL** générée côté app : l’app vérifie que l’utilisateur (incubé ou staff) a le droit de voir le module, puis appelle `storage.from('module-assets').createSignedUrl(path, expiry)` et renvoie l’URL au client pour affichage dans le viewer (iframe / PDF viewer). Ainsi, on n’expose pas de policy « download » directe ; l’app contrôle l’accès.

- **Name** : `Authenticated read for signed URLs`
- **Allowed operation(s)** : SELECT
- **Target roles** : authenticated
- **Policy definition** : `bucket_id = 'module-assets'`  
  (l’accès réel est contrôlé par la génération de signed URL uniquement après vérification en base que l’utilisateur a droit au module).

## 3. Convention de chemins

- Recommandé : `{organisation_id}/{module_id}/{asset_id}_{filename}`  
  pour éviter les collisions et permettre des policies par segment si besoin.
- L’app enregistre dans `learning_module_assets.storage_path` ce chemin après upload.

## 4. Côté app

- **Upload** : depuis Admin Org, après sélection du module (vérifier que `module.organisation_id` = org de l’admin), appeler `supabase.storage.from('module-assets').upload(path, file, { upsert: false })`, puis insérer une ligne dans `learning_module_assets` avec `storage_path = path`, `type = 'document'`, `url_or_path` peut rester null ou égal à `path` pour affichage.
- **Preview incubé** : récupérer l’asset, vérifier que l’incubé a accès au module ; si `type = 'document'` et `storage_path` présent, appeler `supabase.storage.from('module-assets').createSignedUrl(asset.storage_path, 3600)` et afficher l’URL dans un iframe ou viewer PDF sans bouton « Télécharger ».
