# Migrations pré-production SAVANA

Exécuter les scripts suivants **dans l’ordre** dans le **SQL Editor** Supabase (ou via MCP Supabase) avant la mise en production.

1. **learning_modules – colonnes promotion et formateur**  
   Fichier : [migration-learning-modules-promotion-formateur.sql](migration-learning-modules-promotion-formateur.sql)  
   → Ajoute `promotion_id` et `formateur_id` à `learning_modules`. Sans cette migration, l’erreur « column learning_modules.promotion_id does not exist » et les 400 sur les modules apparaissent.

2. **learning_modules – politique RLS Admin Org**  
   Fichier : [migration-learning-modules-admin-org-delete.sql](migration-learning-modules-admin-org-delete.sql)  
   → Permet à l’admin org de supprimer/modifier les modules de son organisation (basé sur `staff_users`).

3. **Storage – boîte à outils (documents uploadés)**  
   Fichier : [migration-storage-toolbox-documents.sql](migration-storage-toolbox-documents.sql)  
   → Crée le bucket `toolbox-documents` et les politiques RLS pour l’upload par Admin Org et la lecture par incubés/staff.

Après exécution, vérifier que le portail incubé charge les modules sans erreur 400 et que l’admin org peut supprimer des modules.
