-- Créer le Super Admin manuellement (si le script npm échoue avec "Invalid API key")
--
-- ÉTAPE 1 : Créer l'utilisateur Auth dans Supabase Dashboard
--   → Authentication → Users → Add user
--   → Email : contact.cherif.pro@gmail.com
--   → Password : (choisissez un mot de passe)
--   → Auto Confirm User : activé
--
-- ÉTAPE 2 : Exécuter ce SQL dans Supabase → SQL Editor

insert into public.staff_users (auth_user_id, full_name, email, role, organisation_id)
select 
  id, 
  'Contact Cherif Pro', 
  'contact.cherif.pro@gmail.com', 
  'SUPER_ADMIN', 
  null
from auth.users 
where email = 'contact.cherif.pro@gmail.com'
on conflict (email) do update set 
  role = 'SUPER_ADMIN', 
  full_name = excluded.full_name,
  auth_user_id = excluded.auth_user_id;
