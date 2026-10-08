-- FocusFlow — schéma v6 (projet Supabase vide). À exécuter dans l'éditeur SQL.
-- État final : base + durcissement (001) + session Focus atomique (002) + notifications push (003).
-- Une installation fraîche n'a AUCUNE migration supplémentaire à appliquer.
-- Principe : la base est la source de vérité. Les dates "métier" sont de type date
-- (jour local de l'utilisateur), ce qui évite les décalages de fuseau horaire.

create extension if not exists "pgcrypto";

create table public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  display_name   text,
  hardcore_mode  boolean not null default false,
  remind_enabled boolean not null default false,
  remind_hour    smallint check (remind_hour between 0 and 23),
  timezone       text,
  created_at     timestamptz not null default now()
);

create table public.domains (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  icon       text not null default 'target',
  color      text not null default '#7B61FF',
  created_at timestamptz not null default now()
);

create table public.goals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  domain_id   uuid not null references public.domains(id) on delete cascade,
  title       text not null,
  description text,
  deadline    date,
  created_at  timestamptz not null default now()
);

create table public.active_challenges (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  challenge_id text not null,            -- id du catalogue ("ch-sport-21") ou uuid d'un challenge perso
  title        text not null,
  color        text not null default '#7B61FF',
  start_date   date not null,
  end_date     date not null,
  created_at   timestamptz not null default now()
);

create table public.tasks (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  domain_id           uuid references public.domains(id) on delete set null,
  goal_id             uuid references public.goals(id) on delete set null,
  challenge_active_id uuid references public.active_challenges(id) on delete cascade,
  title               text not null,
  duration            text,
  scheduled_on        date not null,
  done                boolean not null default false,
  done_at             timestamptz,
  xp_value            integer not null default 10,
  priority            text not null default 'medium' check (priority in ('low','medium','high')),
  postponed           boolean not null default false,
  created_at          timestamptz not null default now()
);
create index tasks_user_day_idx on public.tasks(user_id, scheduled_on);

create table public.custom_challenges (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  title         text not null,
  description   text not null default '',
  duration_days integer not null default 30 check (duration_days between 1 and 365),
  color         text not null default '#7B61FF',
  blueprints    jsonb not null default '[]',  -- [{title, duration, frequency}]
  created_at    timestamptz not null default now()
);

create table public.rest_days (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day     date not null,
  unique (user_id, day)
);

create table public.focus_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  task_id      uuid references public.tasks(id) on delete set null,
  minutes      integer not null,
  completed_on date not null,
  created_at   timestamptz not null default now()
);

-- Notifications push (migration 003).
-- Un abonnement par appareil : endpoint unique (l'app fait un upsert à l'activation).
create table public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);

-- Journal anti-doublon : une ligne par (utilisateur, type, jour). La clé primaire sert de verrou
-- (l'insertion est ignorée si le rappel est déjà parti). Réservé au service_role (aucune politique RLS).
create table public.push_log (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind    text not null check (kind in ('daily', 'streak')),
  day     date not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, kind, day)
);

-- Index : les lectures filtrent toutes sur user_id (voir migration 001).
create index domains_user_idx           on public.domains(user_id);
create index goals_user_idx             on public.goals(user_id);
create index goals_domain_idx           on public.goals(domain_id);
create index active_challenges_user_idx on public.active_challenges(user_id);
create index custom_challenges_user_idx on public.custom_challenges(user_id);
create index focus_sessions_user_idx    on public.focus_sessions(user_id, completed_on);
create index tasks_goal_idx             on public.tasks(goal_id);
create index tasks_domain_idx           on public.tasks(domain_id);
create index tasks_challenge_idx        on public.tasks(challenge_active_id);
create index push_subscriptions_user_idx on public.push_subscriptions(user_id);

-- Row Level Security : chaque utilisateur ne voit et ne modifie que ses lignes.
alter table public.profiles          enable row level security;
alter table public.domains           enable row level security;
alter table public.goals             enable row level security;
alter table public.active_challenges enable row level security;
alter table public.tasks             enable row level security;
alter table public.custom_challenges enable row level security;
alter table public.rest_days         enable row level security;
alter table public.focus_sessions    enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.push_log          enable row level security;

-- (select auth.uid()) est évalué une seule fois par requête au lieu d'une fois par ligne.
-- Les tables qui pointent vers d'autres tables vérifient en plus que la ligne liée appartient
-- bien à l'utilisateur (durcissement de la migration 001).
create policy "own profile" on public.profiles for all
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "own domains" on public.domains for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "own goals" on public.goals for all
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.domains d where d.id = domain_id and d.user_id = (select auth.uid()))
  );

create policy "own active" on public.active_challenges for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "own tasks" on public.tasks for all
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (domain_id is null or exists (select 1 from public.domains d where d.id = domain_id and d.user_id = (select auth.uid())))
    and (goal_id is null or exists (select 1 from public.goals g where g.id = goal_id and g.user_id = (select auth.uid())))
    and (challenge_active_id is null or exists (select 1 from public.active_challenges a where a.id = challenge_active_id and a.user_id = (select auth.uid())))
  );

create policy "own custom" on public.custom_challenges for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "own rest days" on public.rest_days for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "own focus" on public.focus_sessions for all
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (task_id is null or exists (select 1 from public.tasks t where t.id = task_id and t.user_id = (select auth.uid())))
  );

create policy "own push subs" on public.push_subscriptions for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- push_log : aucune politique volontairement. Seule la clé service_role (fonction serveur
-- api/notify.js) peut la lire et l'écrire ; les clients ne la manipulent jamais.

-- Contraintes de valeurs (migration 001) : sur un projet vide, elles s'appliquent dès la
-- première ligne insérée.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'tasks_xp_range') then
    alter table public.tasks add constraint tasks_xp_range check (xp_value between 0 and 500);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'tasks_title_len') then
    alter table public.tasks add constraint tasks_title_len check (char_length(title) between 1 and 200);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'tasks_duration_len') then
    alter table public.tasks add constraint tasks_duration_len check (duration is null or char_length(duration) <= 40);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'domains_name_len') then
    alter table public.domains add constraint domains_name_len check (char_length(name) between 1 and 80);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'domains_color_fmt') then
    alter table public.domains add constraint domains_color_fmt check (color ~ '^#[0-9a-fA-F]{6}$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'goals_title_len') then
    alter table public.goals add constraint goals_title_len check (char_length(title) between 1 and 200);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'goals_description_len') then
    alter table public.goals add constraint goals_description_len check (description is null or char_length(description) <= 2000);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'active_color_fmt') then
    alter table public.active_challenges add constraint active_color_fmt check (color ~ '^#[0-9a-fA-F]{6}$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'custom_title_len') then
    alter table public.custom_challenges add constraint custom_title_len check (char_length(title) between 1 and 200);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'custom_color_fmt') then
    alter table public.custom_challenges add constraint custom_color_fmt check (color ~ '^#[0-9a-fA-F]{6}$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'focus_minutes_range') then
    alter table public.focus_sessions add constraint focus_minutes_range check (minutes between 1 and 600);
  end if;
end $$;

-- Création automatique du profil à l'inscription.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Enregistrement atomique d'une session Focus (identique à la migration 002) :
-- la session et le cochage de la tâche liée réussissent ou échouent ensemble.
create or replace function public.record_focus_session(
  p_minutes      integer,
  p_task_id      uuid,
  p_completed_on date
)
returns json
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_session public.focus_sessions;
  v_task    public.tasks;
begin
  insert into public.focus_sessions (user_id, minutes, task_id, completed_on)
  values (auth.uid(), p_minutes, p_task_id, p_completed_on)
  returning * into v_session;

  if p_task_id is not null then
    update public.tasks
       set done = true, done_at = now()
     where id = p_task_id and user_id = auth.uid()
     returning * into v_task;
  end if;

  return json_build_object('session', to_jsonb(v_session), 'task', to_jsonb(v_task));
end;
$$;

revoke execute on function public.record_focus_session(integer, uuid, date) from public, anon;
grant execute on function public.record_focus_session(integer, uuid, date) to authenticated;
