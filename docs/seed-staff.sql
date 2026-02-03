-- Seed STAFF : à exécuter après avoir créé les utilisateurs dans Supabase Auth.
-- 1. Va dans Supabase → Authentication → Users → Add user (ou utilise Sign up depuis l'app).
-- 2. Récupère l'UUID de chaque utilisateur (colonne "UID" ou "id" dans la liste Users).
-- 3. Remplace ci-dessous les UUID par les vrais, puis exécute ce script.

-- Exemple : tu as créé admin@cerip.sn avec l'UID abc12345-0000-0000-0000-000000000001
-- et coach@cerip.sn avec l'UID def67890-0000-0000-0000-000000000002

insert into public.staff_users (auth_user_id, full_name, email, role, organisation_id)
values
  ('REMPLACER_PAR_UID_SUPER_ADMIN', 'Super Admin Savana', 'superadmin@cerip.sn', 'SUPER_ADMIN', null),
  ('REMPLACER_PAR_UID_ADMIN_ORG', 'Admin CERIP Dakar', 'admin@cerip.sn', 'ADMIN_ORG', 'cerip-dakar'),
  ('REMPLACER_PAR_UID_COACH', 'Coach Sénégal', 'coach@cerip.sn', 'COACH', 'cerip-dakar')
on conflict (email) do update set
  auth_user_id = excluded.auth_user_id,
  full_name = excluded.full_name,
  role = excluded.role,
  organisation_id = excluded.organisation_id;

-- Si la table staff_users n'a pas de contrainte UNIQUE sur email, enlève "on conflict (email) do update"
-- et utilise uniquement les 3 lignes insert (en remplaçant les UUID). En cas de doublon email, supprime d'abord l'ancienne ligne.
