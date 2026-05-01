-- ════════════════════════════════════════════
-- FocusFlow — Supabase PostgreSQL Schema
-- ════════════════════════════════════════════

-- Enable Row Level Security
create extension if not exists "uuid-ossp";

-- ── Users (extends Supabase auth.users) ──────────────────────────────────────
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  streak_count integer default 0,
  last_active date,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Users can manage their own profile"
  on public.profiles for all using (auth.uid() = id);

-- ── Domains ───────────────────────────────────────────────────────────────────
create table public.domains (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  icon text not null default '🎯',
  color text not null default '#6d5aec',
  created_at timestamptz default now()
);
alter table public.domains enable row level security;
create policy "Users can manage their own domains"
  on public.domains for all using (auth.uid() = user_id);
create index domains_user_id_idx on public.domains(user_id);

-- ── Goals ─────────────────────────────────────────────────────────────────────
create table public.goals (
  id uuid default uuid_generate_v4() primary key,
  domain_id uuid references public.domains(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  deadline date,
  created_at timestamptz default now()
);
alter table public.goals enable row level security;
create policy "Users can manage their own goals"
  on public.goals for all using (auth.uid() = user_id);
create index goals_domain_id_idx on public.goals(domain_id);
create index goals_user_id_idx on public.goals(user_id);

-- ── Sub-goals ─────────────────────────────────────────────────────────────────
create table public.sub_goals (
  id uuid default uuid_generate_v4() primary key,
  goal_id uuid references public.goals(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  type text check (type in ('weekly', 'daily')) default 'weekly',
  target_hours numeric(5,2) default 0,
  created_at timestamptz default now()
);
alter table public.sub_goals enable row level security;
create policy "Users can manage their own sub_goals"
  on public.sub_goals for all using (auth.uid() = user_id);
create index sub_goals_goal_id_idx on public.sub_goals(goal_id);

-- ── Tasks ─────────────────────────────────────────────────────────────────────
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  domain_id uuid references public.domains(id) on delete set null,
  goal_id uuid references public.goals(id) on delete set null,
  sub_goal_id uuid references public.sub_goals(id) on delete set null,
  title text not null,
  duration text,
  scheduled_at timestamptz not null default now(),
  done boolean default false,
  done_at timestamptz,
  created_at timestamptz default now()
);
alter table public.tasks enable row level security;
create policy "Users can manage their own tasks"
  on public.tasks for all using (auth.uid() = user_id);
create index tasks_user_id_idx on public.tasks(user_id);
create index tasks_scheduled_at_idx on public.tasks(scheduled_at);
create index tasks_done_idx on public.tasks(done);

-- ── Helper function: calculate goal progress ──────────────────────────────────
create or replace function get_goal_progress(p_goal_id uuid)
returns integer as $$
declare
  v_total integer;
  v_done integer;
  v_sg_count integer;
  v_sg_avg numeric;
begin
  -- Check if sub-goals exist
  select count(*) into v_sg_count from sub_goals where goal_id = p_goal_id;
  
  if v_sg_count > 0 then
    -- Average of sub-goal progresses
    select avg(sg_progress) into v_sg_avg from (
      select 
        case when count(t.id) = 0 then 0
        else round(count(t.id) filter (where t.done) * 100.0 / count(t.id))
        end as sg_progress
      from sub_goals sg
      left join tasks t on t.sub_goal_id = sg.id
      where sg.goal_id = p_goal_id
      group by sg.id
    ) sub;
    return coalesce(v_sg_avg, 0)::integer;
  else
    -- Direct tasks
    select count(*), count(*) filter (where done)
    into v_total, v_done
    from tasks where goal_id = p_goal_id;
    if v_total = 0 then return 0; end if;
    return round(v_done * 100.0 / v_total)::integer;
  end if;
end;
$$ language plpgsql;

-- ── Challenges ────────────────────────────────────────────────────────────────
create table public.challenges (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  duration_days integer not null default 30,
  color text not null default '#6d5aec',
  icon text not null default 'Trophy',
  created_at timestamptz default now()
);

-- ── Challenge Blueprints ──────────────────────────────────────────────────────
create table public.challenge_blueprints (
  id uuid default uuid_generate_v4() primary key,
  challenge_id uuid references public.challenges(id) on delete cascade not null,
  domain_id uuid references public.domains(id) on delete set null,
  title text not null,
  duration text,
  created_at timestamptz default now()
);

-- ── Active Challenges (user instances) ───────────────────────────────────────
create table public.active_challenges (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  challenge_id uuid references public.challenges(id) on delete cascade not null,
  start_date date not null,
  end_date date not null,
  is_active boolean default true,
  created_at timestamptz default now()
);
alter table public.active_challenges enable row level security;
create policy "Users can manage their own active_challenges"
  on public.active_challenges for all using (auth.uid() = user_id);
create index active_challenges_user_id_idx on public.active_challenges(user_id);

-- challenge_id stored in tasks.goal_id as 'challenge:<active_challenge_id>'
-- for lightweight tagging without schema migration on tasks table.
-- In a production migration, add a dedicated challenge_active_id column:
-- alter table public.tasks add column challenge_active_id uuid references public.active_challenges(id) on delete set null;
