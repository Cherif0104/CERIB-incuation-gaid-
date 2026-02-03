-- Seed : données persistantes réalistes pour Savana
-- À exécuter dans Supabase SQL Editor après schema.sql et migration-invitations.sql
-- (et éventuellement rls-invitation_codes.sql)

-- Nettoyer les anciennes données mock si besoin (décommenter si vous repartez de zéro)
-- truncate public.certification_candidates, public.certification_sessions, public.assignations,
--   public.incubes, public.invitation_codes, public.promotions, public.staff_users, public.organisations restart identity cascade;

-- =============================================================================
-- 1. ORGANISATIONS
-- =============================================================================
insert into public.organisations (id, name, account_type, quota_incubes, quota_coachs, is_suspended)
values
  ('cerip-dakar', 'CERIP Dakar', 'PREMIUM', 50, 10, false),
  ('incubateur-thies', 'Incubateur Thiès', 'STANDARD', 30, 5, false)
on conflict (id) do update set
  name = excluded.name,
  account_type = excluded.account_type,
  quota_incubes = excluded.quota_incubes,
  quota_coachs = excluded.quota_coachs,
  is_suspended = excluded.is_suspended;

-- =============================================================================
-- 2. PROMOTIONS (CERIP Dakar)
-- =============================================================================
insert into public.promotions (id, name, organisation_id, parcours_type, start_mode, end_rule)
values
  ('promo-2025-1', 'Promotion Start 2025', 'cerip-dakar', 'P1', 'P1', 'SESSION_END'),
  ('promo-2025-2', 'Incubation 2025', 'cerip-dakar', 'MIXTE', 'P1', 'CERTIFICATION'),
  ('promo-thies-2025', 'Promo Thiès 2025', 'incubateur-thies', 'P1', 'P1', 'SESSION_END')
on conflict (id) do update set
  name = excluded.name,
  organisation_id = excluded.organisation_id,
  parcours_type = excluded.parcours_type,
  start_mode = excluded.start_mode,
  end_rule = excluded.end_rule;

-- =============================================================================
-- 3. CODES D'INVITATION (pour enrôlement incubés)
-- =============================================================================
insert into public.invitation_codes (code, organisation_id, expires_at, max_uses, used_count)
values
  ('cerip2025', 'cerip-dakar', now() + interval '90 days', 20, 0),
  ('thies25', 'incubateur-thies', now() + interval '60 days', 10, 0)
on conflict (code) do update set
  expires_at = excluded.expires_at,
  max_uses = excluded.max_uses;

-- =============================================================================
-- 4. INCUBÉS (sans compte Auth : ils s'inscriront via le code d'invitation)
-- =============================================================================
-- auth_user_id sera rempli quand l'incubé acceptera l'invitation (page /accept-invitation).
insert into public.incubes (full_name, email, organisation_id, current_parcours, global_status, auth_user_id)
select * from (values
  ('Awa Diop', 'awa.diop@exemple.sn', 'cerip-dakar', 'P1', 'P1_EN_COURS', null::uuid),
  ('Moussa Sow', 'moussa.sow@exemple.sn', 'cerip-dakar', 'P1', 'P1_EN_COURS', null::uuid),
  ('Fatou Ndiaye', 'fatou.ndiaye@exemple.sn', 'cerip-dakar', 'P2', 'P2_EN_COURS', null::uuid),
  ('Ibrahima Fall', 'ibrahima.fall@exemple.sn', 'incubateur-thies', 'P1', 'P1_EN_COURS', null::uuid)
) as v(full_name, email, organisation_id, current_parcours, global_status, auth_user_id)
on conflict (email) do update set
  full_name = excluded.full_name,
  organisation_id = excluded.organisation_id,
  current_parcours = excluded.current_parcours,
  global_status = excluded.global_status;
