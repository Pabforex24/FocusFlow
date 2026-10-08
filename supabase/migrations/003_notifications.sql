-- FocusFlow — migration 003 : notifications push (à exécuter UNE FOIS dans Supabase > SQL Editor).
-- Rejouable sans danger : chaque instruction vérifie d'abord si elle est déjà appliquée.
-- Contenu : (1) réglages de rappel sur le profil, (2) abonnements push, (3) journal anti-doublon.
-- La planification horaire est décrite dans supabase/setup_cron_notify.sql (pg_cron + pg_net).

-- ── 1. Réglages de rappel sur le profil ───────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists remind_enabled boolean not null default false,
  add column if not exists remind_hour    smallint check (remind_hour between 0 and 23),
  add column if not exists timezone       text;

-- ── 2. Abonnements push (une ligne par appareil) ──────────────────────────────────────────────
-- endpoint est unique : un même navigateur ne peut s'abonner qu'une fois (upsert côté app).
create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions(user_id);

-- ── 3. Journal anti-doublon ───────────────────────────────────────────────────────────────────
-- Une ligne par (utilisateur, type, jour) : empêche d'envoyer deux fois le même rappel.
-- La clé primaire sert de verrou : l'insertion est ignorée si le rappel est déjà parti.
create table if not exists public.push_log (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind    text not null check (kind in ('daily', 'streak')),
  day     date not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, kind, day)
);

-- ── Row Level Security ────────────────────────────────────────────────────────────────────────
alter table public.push_subscriptions enable row level security;
alter table public.push_log enable row level security;

drop policy if exists "own push subs" on public.push_subscriptions;
create policy "own push subs" on public.push_subscriptions for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- push_log : AUCUNE politique volontairement. La table n'est lisible/écrite que par la clé
-- service_role (fonction serveur api/notify.js) ; les clients ne peuvent pas la manipuler.
