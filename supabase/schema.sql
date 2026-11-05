-- FocusFlow — schéma v7 (projet Supabase vide). À exécuter dans l'éditeur SQL.
-- État final : base + durcissement (001) + session Focus atomique (002) + notifications push (003) + défis partagés (010).
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
  postponed_from      date,          -- jour quitté en reportant (gèle la sanction du jour manqué)
  series_id           uuid,
  repeat              jsonb,
  created_at          timestamptz not null default now()
);
create index tasks_user_day_idx on public.tasks(user_id, scheduled_on);
create index tasks_series_idx on public.tasks(series_id);

create table public.custom_challenges (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  title         text not null,
  description   text not null default '',
  duration_days integer not null default 30 check (duration_days between 1 and 365),
  color         text not null default '#7B61FF',
  icon          text not null default 'flag',
  blueprints    jsonb not null default '[]',  -- [{title, duration, frequency, weekdays?}]
  created_at    timestamptz not null default now()
);

create table public.rest_days (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day     date not null,
  unique (user_id, day)
);

create table public.pause_periods (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  start_date date not null,
  end_date   date not null,
  label      text,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
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
create index pause_periods_user_idx     on public.pause_periods(user_id, start_date);
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

create policy "own pauses" on public.pause_periods for all
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
    alter table public.focus_sessions add constraint focus_minutes_range check (minutes between 1 and 1440);
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

-- Défis partagés (identique à la migration 010).
-- FocusFlow — migration 010 : défis partagés (à exécuter UNE FOIS dans Supabase > SQL Editor).
--
-- Un défi partagé n'échange pas les tâches entre utilisateurs. Le groupe porte le programme
-- commun et les dates ; chaque membre reçoit ses propres tâches, son domaine et sa progression.
-- Les écritures passent par des fonctions security definer, les lectures par RLS.

create table if not exists public.challenge_groups (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users(id) on delete cascade,
  title         text not null,
  description   text not null default '',
  color         text not null default '#7B61FF',
  icon          text not null default 'flag',
  duration_days integer not null check (duration_days between 1 and 365),
  start_date    date not null,
  end_date      date not null,
  blueprints    jsonb not null default '[]'
                check (jsonb_typeof(blueprints) = 'array' and jsonb_array_length(blueprints) between 1 and 30),
  status        text not null default 'open' check (status in ('open', 'archived')),
  join_code     text not null unique,
  created_at    timestamptz not null default now(),
  check (end_date >= start_date),
  check (char_length(title) between 1 and 120),
  check (char_length(description) <= 500),
  check (char_length(icon) between 1 and 40),
  check (color ~ '^#[0-9a-fA-F]{6}$')
);

create table if not exists public.challenge_members (
  id        uuid primary key default gen_random_uuid(),
  group_id  uuid not null references public.challenge_groups(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  role      text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);

-- Rattache la copie personnelle du défi au groupe. Les tâches restent la propriété du membre.
alter table public.active_challenges
  add column if not exists group_id uuid references public.challenge_groups(id) on delete set null;

create unique index if not exists active_challenges_group_user_idx
  on public.active_challenges(group_id, user_id) where group_id is not null;
create index if not exists active_challenges_group_idx on public.active_challenges(group_id);
create index if not exists challenge_members_group_idx on public.challenge_members(group_id);
create index if not exists challenge_members_user_idx on public.challenge_members(user_id);

alter table public.challenge_groups enable row level security;
alter table public.challenge_members enable row level security;

-- Évite la récursion RLS : la fonction lit la table avec les droits de son propriétaire.
create or replace function public.is_challenge_member(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.challenge_members
    where group_id = p_group_id and user_id = auth.uid()
  );
$$;

revoke all on function public.is_challenge_member(uuid) from public, anon;
grant execute on function public.is_challenge_member(uuid) to authenticated;

drop policy if exists "read shared groups" on public.challenge_groups;
create policy "read shared groups" on public.challenge_groups for select
  using (owner_id = (select auth.uid()) or public.is_challenge_member(id));

drop policy if exists "read shared members" on public.challenge_members;
create policy "read shared members" on public.challenge_members for select
  using (public.is_challenge_member(group_id));

-- Code d'invitation court, non devinable, sans caractères ambigus.
create or replace function public.new_challenge_code()
returns text
language plpgsql
volatile
set search_path = public
as $$
declare
  code text;
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  loop
    code := '';
    for i in 1..8 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.challenge_groups where join_code = code);
  end loop;
  return code;
end;
$$;

revoke all on function public.new_challenge_code() from public, anon, authenticated;

create or replace function public.create_shared_challenge(
  p_title         text,
  p_description   text,
  p_color         text,
  p_icon          text,
  p_duration_days integer,
  p_start_date    date,
  p_end_date      date,
  p_blueprints    jsonb,
  p_domain_id     uuid,
  p_tasks         jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_group   public.challenge_groups;
  v_member  public.challenge_members;
  v_active  public.active_challenges;
  v_members jsonb;
  v_tasks   jsonb;
begin
  if v_uid is null then
    raise exception 'Authentification requise.';
  end if;
  if p_title is null or char_length(btrim(p_title)) not between 1 and 120 then
    raise exception 'Le titre doit contenir entre 1 et 120 caractères.';
  end if;
  if p_description is not null and char_length(p_description) > 500 then
    raise exception 'La description est trop longue.';
  end if;
  if p_color is null or p_color !~ '^#[0-9a-fA-F]{6}$' then
    raise exception 'Couleur invalide.';
  end if;
  if p_icon is null or char_length(p_icon) not between 1 and 40 then
    raise exception 'Icône invalide.';
  end if;
  if p_duration_days is null or p_duration_days not between 1 and 365 then
    raise exception 'La durée doit être comprise entre 1 et 365 jours.';
  end if;
  if p_start_date is null or p_end_date is null or p_end_date < p_start_date then
    raise exception 'Dates invalides.';
  end if;
  if p_blueprints is null or jsonb_typeof(p_blueprints) <> 'array'
     or jsonb_array_length(p_blueprints) not between 1 and 30 then
    raise exception 'Le programme doit contenir entre 1 et 30 tâches récurrentes.';
  end if;
  if p_tasks is null or jsonb_typeof(p_tasks) <> 'array'
     or jsonb_array_length(p_tasks) not between 1 and 5000 then
    raise exception 'Le nombre de tâches doit être compris entre 1 et 5000.';
  end if;
  if p_domain_id is null or not exists (
    select 1 from public.domains where id = p_domain_id and user_id = v_uid
  ) then
    raise exception 'Domaine invalide.';
  end if;
  if exists (
    select 1 from jsonb_to_recordset(p_tasks) as t(scheduled_on date)
    where t.scheduled_on is null or t.scheduled_on < p_start_date or t.scheduled_on > p_end_date
  ) then
    raise exception 'Les tâches doivent rester dans la période du défi.';
  end if;

  insert into public.challenge_groups (
    owner_id, title, description, color, icon, duration_days, start_date, end_date, blueprints, join_code
  ) values (
    v_uid, btrim(p_title), coalesce(btrim(p_description), ''), p_color, p_icon,
    p_duration_days, p_start_date, p_end_date, p_blueprints, public.new_challenge_code()
  ) returning * into v_group;

  insert into public.challenge_members (group_id, user_id, role)
  values (v_group.id, v_uid, 'owner')
  returning * into v_member;

  insert into public.active_challenges (
    user_id, group_id, challenge_id, title, color, start_date, end_date
  ) values (
    v_uid, v_group.id, 'group:' || v_group.id, v_group.title, v_group.color, v_group.start_date, v_group.end_date
  ) returning * into v_active;

  with inserted as (
    insert into public.tasks (
      user_id, domain_id, challenge_active_id, title, duration, scheduled_on, xp_value, priority
    )
    select
      v_uid, p_domain_id, v_active.id, t.title,
      nullif(btrim(coalesce(t.duration, '')), ''),
      t.scheduled_on, coalesce(t.xp_value, 20), coalesce(t.priority, 'medium')
    from jsonb_to_recordset(p_tasks) as t(
      title text, duration text, scheduled_on date, xp_value integer, priority text
    )
    returning *
  )
  select coalesce(jsonb_agg(to_jsonb(inserted)), '[]'::jsonb) into v_tasks from inserted;

  select coalesce(jsonb_agg(to_jsonb(m) order by m.joined_at), '[]'::jsonb)
    into v_members
    from public.challenge_members m
   where m.group_id = v_group.id;

  return jsonb_build_object(
    'group', to_jsonb(v_group),
    'active', to_jsonb(v_active),
    'member', to_jsonb(v_member),
    'members', v_members,
    'tasks', v_tasks
  );
end;
$$;

revoke all on function public.create_shared_challenge(text, text, text, text, integer, date, date, jsonb, uuid, jsonb)
  from public, anon;
grant execute on function public.create_shared_challenge(text, text, text, text, integer, date, date, jsonb, uuid, jsonb)
  to authenticated;

create or replace function public.join_shared_challenge(
  p_code      text,
  p_domain_id uuid,
  p_tasks     jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_group   public.challenge_groups;
  v_member  public.challenge_members;
  v_active  public.active_challenges;
  v_members jsonb;
  v_tasks   jsonb;
begin
  if v_uid is null then
    raise exception 'Authentification requise.';
  end if;
  select * into v_group
    from public.challenge_groups
   where join_code = upper(btrim(coalesce(p_code, '')));
  if not found then
    raise exception 'Invitation introuvable.';
  end if;
  if v_group.status <> 'open' then
    raise exception 'Ce défi n''accepte plus de participants.';
  end if;
  if exists (
    select 1 from public.challenge_members where group_id = v_group.id and user_id = v_uid
  ) then
    raise exception 'Vous participez déjà à ce défi.';
  end if;
  if p_domain_id is null or not exists (
    select 1 from public.domains where id = p_domain_id and user_id = v_uid
  ) then
    raise exception 'Domaine invalide.';
  end if;
  if p_tasks is null or jsonb_typeof(p_tasks) <> 'array'
     or jsonb_array_length(p_tasks) not between 1 and 5000 then
    raise exception 'Le nombre de tâches doit être compris entre 1 et 5000.';
  end if;
  if exists (
    select 1 from jsonb_to_recordset(p_tasks) as t(scheduled_on date)
    where t.scheduled_on is null or t.scheduled_on < v_group.start_date
       or t.scheduled_on > v_group.end_date
  ) then
    raise exception 'Les tâches doivent rester dans la période du défi.';
  end if;

  insert into public.challenge_members (group_id, user_id, role)
  values (v_group.id, v_uid, 'member')
  returning * into v_member;

  insert into public.active_challenges (
    user_id, group_id, challenge_id, title, color, start_date, end_date
  ) values (
    v_uid, v_group.id, 'group:' || v_group.id, v_group.title, v_group.color, v_group.start_date, v_group.end_date
  ) returning * into v_active;

  with inserted as (
    insert into public.tasks (
      user_id, domain_id, challenge_active_id, title, duration, scheduled_on, xp_value, priority
    )
    select
      v_uid, p_domain_id, v_active.id, t.title,
      nullif(btrim(coalesce(t.duration, '')), ''),
      t.scheduled_on, coalesce(t.xp_value, 20), coalesce(t.priority, 'medium')
    from jsonb_to_recordset(p_tasks) as t(
      title text, duration text, scheduled_on date, xp_value integer, priority text
    )
    returning *
  )
  select coalesce(jsonb_agg(to_jsonb(inserted)), '[]'::jsonb) into v_tasks from inserted;

  select coalesce(jsonb_agg(to_jsonb(m) order by m.joined_at), '[]'::jsonb)
    into v_members
    from public.challenge_members m
   where m.group_id = v_group.id;

  return jsonb_build_object(
    'group', to_jsonb(v_group),
    'active', to_jsonb(v_active),
    'member', to_jsonb(v_member),
    'members', v_members,
    'tasks', v_tasks
  );
end;
$$;

revoke all on function public.join_shared_challenge(text, uuid, jsonb) from public, anon;
grant execute on function public.join_shared_challenge(text, uuid, jsonb) to authenticated;

create or replace function public.get_shared_challenge_preview(p_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_group   public.challenge_groups;
  v_owner   text;
  v_members integer;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise.';
  end if;
  select * into v_group
    from public.challenge_groups
   where join_code = upper(btrim(coalesce(p_code, '')));
  if not found then
    return null;
  end if;
  select coalesce(nullif(btrim(display_name), ''), 'Organisateur')
    into v_owner
    from public.profiles
   where id = v_group.owner_id;
  select count(*) into v_members
    from public.challenge_members
   where group_id = v_group.id;
  return jsonb_build_object(
    'group', to_jsonb(v_group) - 'join_code',
    'ownerName', v_owner,
    'memberCount', v_members,
    'alreadyMember', exists (
      select 1 from public.challenge_members
       where group_id = v_group.id and user_id = auth.uid()
    )
  );
end;
$$;

revoke all on function public.get_shared_challenge_preview(text) from public, anon;
grant execute on function public.get_shared_challenge_preview(text) to authenticated;

create or replace function public.get_shared_challenge_leaderboard(p_group_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.is_challenge_member(p_group_id) then
    raise exception 'Accès refusé.' using errcode = '42501';
  end if;

  return (
    select coalesce(jsonb_agg(to_jsonb(x) order by x.pct desc, x.done desc, x.name asc), '[]'::jsonb)
    from (
      select
        m.user_id,
        coalesce(nullif(btrim(pr.display_name), ''), 'Membre') as name,
        (m.user_id = auth.uid()) as me,
        coalesce(count(t.id) filter (where t.done), 0)::int as done,
        count(t.id)::int as total,
        case
          when count(t.id) = 0 then 0
          else round(100.0 * count(t.id) filter (where t.done) / count(t.id))::int
        end as pct
      from public.challenge_members m
      left join public.profiles pr on pr.id = m.user_id
      left join public.active_challenges a on a.group_id = p_group_id and a.user_id = m.user_id
      left join public.tasks t on t.challenge_active_id = a.id
      where m.group_id = p_group_id
      group by m.user_id, pr.display_name
    ) x
  );
end;
$$;

revoke all on function public.get_shared_challenge_leaderboard(uuid) from public, anon;
grant execute on function public.get_shared_challenge_leaderboard(uuid) to authenticated;

create or replace function public.leave_shared_challenge(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_role text;
begin
  if v_uid is null then
    raise exception 'Authentification requise.';
  end if;
  select role into v_role
    from public.challenge_members
   where group_id = p_group_id and user_id = v_uid;
  if v_role is null then
    raise exception 'Vous ne participez pas à ce défi.';
  end if;
  if v_role = 'owner' then
    raise exception 'L''organisateur ne peut pas quitter son défi. Archivez-le à la place.';
  end if;

  delete from public.active_challenges
   where group_id = p_group_id and user_id = v_uid;
  delete from public.challenge_members
   where group_id = p_group_id and user_id = v_uid;
end;
$$;

revoke all on function public.leave_shared_challenge(uuid) from public, anon;
grant execute on function public.leave_shared_challenge(uuid) to authenticated;

create or replace function public.archive_shared_challenge(p_group_id uuid)
returns public.challenge_groups
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group public.challenge_groups;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise.';
  end if;
  update public.challenge_groups
     set status = 'archived'
   where id = p_group_id and owner_id = auth.uid()
  returning * into v_group;
  if v_group.id is null then
    raise exception 'Seul l''organisateur peut archiver ce défi.';
  end if;
  return v_group;
end;
$$;

revoke all on function public.archive_shared_challenge(uuid) from public, anon;
grant execute on function public.archive_shared_challenge(uuid) to authenticated;
