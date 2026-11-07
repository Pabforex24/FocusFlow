-- FocusFlow — migration 011 : socle produit (durées, Focus, notifications, amis, badges).
-- Rejouable : chaque colonne/table est ajoutée avec IF NOT EXISTS.

-- ── 1. Profil ─────────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists first_name        text,
  add column if not exists last_name         text,
  add column if not exists avatar_url        text,
  add column if not exists public_code       text not null default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  add column if not exists profile_visibility text not null default 'friends'
    check (profile_visibility in ('private', 'friends', 'public')),
  add column if not exists directory_opt_in  boolean not null default false,
  add column if not exists notify_prefs      jsonb not null default '{}'::jsonb,
  add column if not exists quiet_start       smallint check (quiet_start between 0 and 23),
  add column if not exists quiet_end         smallint check (quiet_end between 0 and 23);

create unique index if not exists profiles_public_code_idx on public.profiles(upper(public_code));
create index if not exists profiles_directory_idx on public.profiles(lower(coalesce(first_name, display_name)));

-- ── 2. Tâches : durée en minutes, plage horaire, rappel, Focus lié ────────────
create or replace function public.parse_duration_minutes(p_value text)
returns integer
language plpgsql
immutable
set search_path = public
as $$
declare
  v text := lower(btrim(coalesce(p_value, '')));
  m text[];
  total integer;
begin
  if v = '' then return null; end if;
  if v ~ '^[0-9]{1,4}$' then
    total := v::int;
  elsif v ~ '^[0-9]{1,2}:[0-9]{2}$' then
    m := regexp_match(v, '^([0-9]{1,2}):([0-9]{2})$');
    total := m[1]::int * 60 + m[2]::int;
  elsif v ~ '^[0-9]{1,2}\s*(h|heures?|hrs?)\s*[0-9]{0,2}\s*(min|m|minutes?)?$' then
    m := regexp_match(v, '^([0-9]{1,2})\s*(?:h|heures?|hrs?)\s*([0-9]{1,2})?\s*(?:min|m|minutes?)?$');
    total := coalesce(m[1]::int, 0) * 60 + coalesce(m[2]::int, 0);
  elsif v ~ '^[0-9]{1,4}\s*(min|m|minutes?)$' then
    m := regexp_match(v, '^([0-9]{1,4})');
    total := m[1]::int;
  else
    return null;
  end if;
  return least(1440, greatest(1, total));
end;
$$;

alter table public.tasks
  add column if not exists duration_minutes integer
    check (duration_minutes between 1 and 1440),
  add column if not exists start_time time,
  add column if not exists end_time time,
  add column if not exists reminder_minutes smallint
    check (reminder_minutes in (0, 10, 30, 60)),
  add column if not exists focus_linked boolean not null default true;

update public.tasks
   set duration_minutes = public.parse_duration_minutes(duration)
 where duration_minutes is null and duration is not null;

alter table public.tasks
  drop constraint if exists tasks_time_range;
alter table public.tasks
  add constraint tasks_time_range check (end_time is null or start_time is null or end_time >= start_time);

-- ── 3. Notifications in-app ───────────────────────────────────────────────────
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  kind       text not null,
  title      text not null,
  body       text not null default '',
  link       text,
  read_at    timestamptz,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  source_key text not null,
  unique (user_id, source_key)
);
create index if not exists notifications_user_idx on public.notifications(user_id, created_at desc);
create index if not exists notifications_unread_idx on public.notifications(user_id) where read_at is null;

alter table public.notifications enable row level security;
drop policy if exists "own notifications" on public.notifications;
create policy "own notifications" on public.notifications for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- ── 4. Amis ───────────────────────────────────────────────────────────────────
create table if not exists public.friend_requests (
  id         uuid primary key default gen_random_uuid(),
  sender_id  uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  status     text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (sender_id <> receiver_id),
  unique (sender_id, receiver_id)
);
create index if not exists friend_requests_receiver_idx on public.friend_requests(receiver_id, status);

create table if not exists public.friendships (
  id         uuid primary key default gen_random_uuid(),
  user_a     uuid not null references auth.users(id) on delete cascade,
  user_b     uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (user_a < user_b),
  unique (user_a, user_b)
);
create index if not exists friendships_a_idx on public.friendships(user_a);
create index if not exists friendships_b_idx on public.friendships(user_b);

alter table public.friend_requests enable row level security;
alter table public.friendships enable row level security;

drop policy if exists "read own friend requests" on public.friend_requests;
create policy "read own friend requests" on public.friend_requests for select
  using ((select auth.uid()) in (sender_id, receiver_id));
drop policy if exists "send friend request" on public.friend_requests;
create policy "send friend request" on public.friend_requests for insert
  with check ((select auth.uid()) = sender_id);
drop policy if exists "answer friend request" on public.friend_requests;
create policy "answer friend request" on public.friend_requests for update
  using ((select auth.uid()) = receiver_id or (select auth.uid()) = sender_id)
  with check ((select auth.uid()) = receiver_id or (select auth.uid()) = sender_id);
drop policy if exists "delete own friend request" on public.friend_requests;
create policy "delete own friend request" on public.friend_requests for delete
  using ((select auth.uid()) in (sender_id, receiver_id));

drop policy if exists "read own friendships" on public.friendships;
create policy "read own friendships" on public.friendships for select
  using ((select auth.uid()) in (user_a, user_b));
drop policy if exists "delete own friendship" on public.friendships;
create policy "delete own friendship" on public.friendships for delete
  using ((select auth.uid()) in (user_a, user_b));

create or replace function public.make_friends(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req public.friend_requests;
  v_a uuid;
  v_b uuid;
begin
  select * into v_req from public.friend_requests where id = p_request_id for update;
  if not found or v_req.receiver_id <> auth.uid() or v_req.status <> 'pending' then
    raise exception 'Demande introuvable.' using errcode = '42501';
  end if;
  v_a := least(v_req.sender_id, v_req.receiver_id);
  v_b := greatest(v_req.sender_id, v_req.receiver_id);
  update public.friend_requests
     set status = 'accepted', responded_at = now()
   where id = p_request_id;
  insert into public.friendships (user_a, user_b) values (v_a, v_b)
  on conflict (user_a, user_b) do nothing;
end;
$$;
revoke all on function public.make_friends(uuid) from public, anon;
grant execute on function public.make_friends(uuid) to authenticated;

-- ── 5. Badges acquis ──────────────────────────────────────────────────────────
create table if not exists public.earned_badges (
  user_id   uuid not null references auth.users(id) on delete cascade,
  badge_id  text not null,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);
alter table public.earned_badges enable row level security;
drop policy if exists "own earned badges" on public.earned_badges;
create policy "own earned badges" on public.earned_badges for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- ── 6. Focus : ne coche que si la tâche est encore à faire et liée au Focus ───
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
     where id = p_task_id
       and user_id = auth.uid()
       and done = false
       and focus_linked = true
       and scheduled_on <= p_completed_on
     returning * into v_task;

    if v_task is null then
      select * into v_task from public.tasks
       where id = p_task_id and user_id = auth.uid();
    end if;
  end if;

  return json_build_object('session', to_jsonb(v_session), 'task', to_jsonb(v_task));
end;
$$;
revoke execute on function public.record_focus_session(integer, uuid, date) from public, anon;
grant execute on function public.record_focus_session(integer, uuid, date) to authenticated;
