-- Seed production minimal : organisations vides ou avec noms réels, sans incubés ni données fictives.
-- À exécuter manuellement après les migrations si vous souhaitez des organisations pré-créées.
-- En production, l'initialisation peut aussi se faire entièrement via l'UI Super Admin.

-- Exemple : une organisation vide (à adapter avec les noms réels)
insert into public.organisations (id, name, account_type, quota_incubes, quota_coachs, is_suspended)
values
  ('cerip-senegal', 'CERIP Sénégal', 'PREMIUM', 50, 10, false)
on conflict (id) do update set
  name = excluded.name,
  account_type = excluded.account_type,
  quota_incubes = excluded.quota_incubes,
  quota_coachs = excluded.quota_coachs,
  is_suspended = excluded.is_suspended;
