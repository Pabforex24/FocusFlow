-- ═══════════════════════════════════════════════════════════════════════════
-- FocusFlow — Schéma PostgreSQL FINAL v3
-- Aligné avec src/types/index.ts — version complète post-migrations
-- Pour un projet VIDE uniquement. Projet existant → migration_v3.sql
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";

-- ── profiles ─────────────────────────────────────────────────────────────────
create table public.profiles (
  id                      uuid        references auth.users(id) on delete cascade primary key,
  email                   text,
  display_name            text,
  streak_count            integer     not null default 0,
  last_active             text,
  xp                      integer     not null default 0,
  level                   integer     not null default 1,
  badges                  jsonb       not null default '[]',
  total_tasks_done        integer     not null default 0,
  challenges_done         integer     not null default 0,
  longest_streak          integer     not null default 0,
  hardcore_mode           boolean     not null default false,
  deleted_catalogue_ids   jsonb       not null default '[]',
  catalogue_overrides     jsonb       not null default '{}',
  rest_days               jsonb       not null default '[]',
  rest_day_used_this_week boolean     not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "Users manage own profile" on public.profiles for all using (auth.uid() = id);

-- ── domains ──────────────────────────────────────────────────────────────────
create table public.domains (
  id         uuid        default uuid_generate_v4() primary key,
  user_id    uuid        references public.profiles(id) on delete cascade not null,
  name       text        not null,
  icon       text        not null default 'Target',
  color      text        not null default '#7B61FF',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.domains enable row level security;
create policy "Users manage own domains" on public.domains for all using (auth.uid() = user_id);
create index domains_user_id_idx    on public.domains(user_id);
create index domains_updated_at_idx on public.domains(updated_at);

-- ── goals ────────────────────────────────────────────────────────────────────
create table public.goals (
  id           uuid        default uuid_generate_v4() primary key,
  domain_id    uuid        references public.domains(id) on delete cascade not null,
  user_id      uuid        references public.profiles(id) on delete cascade not null,
  title        text        not null,
  description  text,
  unit         text,
  challenge_id text,
  deadline     date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.goals enable row level security;
create policy "Users manage own goals" on public.goals for all using (auth.uid() = user_id);
create index goals_user_id_idx      on public.goals(user_id);
create index goals_domain_id_idx    on public.goals(domain_id);
create index goals_challenge_id_idx on public.goals(challenge_id);
create index goals_updated_at_idx   on public.goals(updated_at);

-- ── active_challenges ────────────────────────────────────────────────────────
create table public.active_challenges (
  id           uuid        default uuid_generate_v4() primary key,
  user_id      uuid        references public.profiles(id) on delete cascade not null,
  challenge_id text        not null,
  start_date   date        not null,
  end_date     date        not null,
  is_active    boolean     not null default true,
  current_day  integer     not null default 1,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.active_challenges enable row level security;
create policy "Users manage own active challenges" on public.active_challenges for all using (auth.uid() = user_id);
create index active_challenges_user_id_idx    on public.active_challenges(user_id);
create index active_challenges_is_active_idx  on public.active_challenges(is_active);
create index active_challenges_updated_at_idx on public.active_challenges(updated_at);

-- ── tasks ────────────────────────────────────────────────────────────────────
create table public.tasks (
  id                  uuid        default uuid_generate_v4() primary key,
  user_id             uuid        references public.profiles(id) on delete cascade not null,
  domain_id           uuid        references public.domains(id) on delete set null,
  goal_id             uuid        references public.goals(id) on delete set null,
  challenge_active_id uuid        references public.active_challenges(id) on delete set null,
  title               text        not null,
  duration            text,
  scheduled_at        timestamptz not null default now(),
  done                boolean     not null default false,
  done_at             timestamptz,
  xp_value            integer     not null default 10,
  priority            text        check (priority in ('low','medium','high')) default 'medium',
  frequency           text        check (frequency in ('daily','workdays','weekend','custom')),
  custom_days         jsonb       not null default '[]',
  is_generated        boolean     not null default false,
  postponed           boolean     not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
alter table public.tasks enable row level security;
create policy "Users manage own tasks" on public.tasks for all using (auth.uid() = user_id);
create index tasks_user_id_idx          on public.tasks(user_id);
create index tasks_scheduled_at_idx     on public.tasks(scheduled_at);
create index tasks_done_idx             on public.tasks(done);
create index tasks_challenge_active_idx on public.tasks(challenge_active_id);
create index tasks_goal_id_idx          on public.tasks(goal_id);
create index tasks_updated_at_idx       on public.tasks(updated_at);

-- ── custom_challenges ────────────────────────────────────────────────────────
create table public.custom_challenges (
  id            uuid        default uuid_generate_v4() primary key,
  user_id       uuid        references public.profiles(id) on delete cascade not null,
  title         text        not null,
  description   text        not null default '',
  duration_days integer     not null default 30,
  deadline      date,
  color         text        not null default '#7B61FF',
  icon          text        not null default 'Trophy',
  blueprints    jsonb       not null default '[]',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table public.custom_challenges enable row level security;
create policy "Users manage own custom challenges" on public.custom_challenges for all using (auth.uid() = user_id);
create index custom_challenges_user_id_idx    on public.custom_challenges(user_id);
create index custom_challenges_updated_at_idx on public.custom_challenges(updated_at);

-- ════════════════════════════════════════════════════════════════════════════
-- Triggers updated_at
-- ════════════════════════════════════════════════════════════════════════════
create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin NEW.updated_at = now(); return NEW; end; $$;

create trigger profiles_updated_at   before update on public.profiles          for each row execute procedure public.update_updated_at();
create trigger domains_updated_at    before update on public.domains            for each row execute procedure public.update_updated_at();
create trigger goals_updated_at      before update on public.goals              for each row execute procedure public.update_updated_at();
create trigger tasks_updated_at      before update on public.tasks              for each row execute procedure public.update_updated_at();
create trigger ac_updated_at         before update on public.active_challenges  for each row execute procedure public.update_updated_at();
create trigger cc_updated_at         before update on public.custom_challenges  for each row execute procedure public.update_updated_at();

-- ════════════════════════════════════════════════════════════════════════════
-- Trigger auto-creation profil a l'inscription
-- ════════════════════════════════════════════════════════════════════════════
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, display_name)
  values (NEW.id, NEW.email, coalesce(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)))
  on conflict (id) do nothing;
  return NEW;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
