-- Progression automatique P1 → P2 : quand score P1 ≥ 70 %, passage en P2
-- À exécuter dans Supabase (SQL Editor)

-- Seuil configurable (70 %)
create or replace function public.check_p1_to_p2_progression()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.p1_score is not null
     and new.p1_score >= 70
     and coalesce(new.current_parcours, 'P1') = 'P1' then
    new.current_parcours := 'P2';
    if new.global_status = 'P1_EN_COURS' then
      new.global_status := 'P2_EN_COURS';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trigger_p1_to_p2 on public.incubes;
create trigger trigger_p1_to_p2
  before update on public.incubes
  for each row
  execute function public.check_p1_to_p2_progression();

comment on function public.check_p1_to_p2_progression() is
  'Passe automatiquement un incubé en P2 quand p1_score >= 70 % (seuil métier CERIP).';
