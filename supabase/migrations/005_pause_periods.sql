-- FocusFlow — migration 005 : périodes de pause (indisponibilité multi-jours).
-- À exécuter UNE FOIS dans Supabase > SQL Editor. Rejouable sans danger.
-- Une pause neutralise des jours (ni pénalité, ni rupture de série) et décale la fin
-- des challenges actifs qui la chevauchent.

create table if not exists public.pause_periods (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  start_date date not null,
  end_date   date not null,
  label      text,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create index if not exists pause_periods_user_idx on public.pause_periods(user_id, start_date);

alter table public.pause_periods enable row level security;

drop policy if exists "own pauses" on public.pause_periods;
create policy "own pauses" on public.pause_periods for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
