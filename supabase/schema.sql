-- FocusFlow — schéma v4 (projet Supabase vide). À exécuter dans l'éditeur SQL.
-- Principe : la base est la source de vérité. Les dates "métier" sont de type date
-- (jour local de l'utilisateur), ce qui évite les décalages de fuseau horaire.

create extension if not exists "pgcrypto";

create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  hardcore_mode boolean not null default false,
  created_at    timestamptz not null default now()
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

-- Row Level Security : chaque utilisateur ne voit et ne modifie que ses lignes.
alter table public.profiles          enable row level security;
alter table public.domains           enable row level security;
alter table public.goals             enable row level security;
alter table public.active_challenges enable row level security;
alter table public.tasks             enable row level security;
alter table public.custom_challenges enable row level security;
alter table public.rest_days         enable row level security;
alter table public.focus_sessions    enable row level security;

create policy "own profile"   on public.profiles for all using (auth.uid() = id)      with check (auth.uid() = id);
create policy "own domains"   on public.domains  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own goals"     on public.goals    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own active"    on public.active_challenges for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own tasks"     on public.tasks    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own custom"    on public.custom_challenges for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rest days" on public.rest_days for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own focus"     on public.focus_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

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
