-- FocusFlow — migration 001 : durcissement de la base (à exécuter UNE FOIS dans Supabase > SQL Editor).
-- Rejouable sans danger : chaque instruction vérifie d'abord si elle est déjà appliquée.
-- Contenu : (1) index, (2) règles RLS plus rapides et qui contrôlent l'appartenance des liens, (3) contraintes de valeurs.

-- ── 1. Index (les lectures filtrent toutes sur user_id) ───────────────────────────────────────
create index if not exists domains_user_idx           on public.domains(user_id);
create index if not exists goals_user_idx             on public.goals(user_id);
create index if not exists goals_domain_idx           on public.goals(domain_id);
create index if not exists active_challenges_user_idx on public.active_challenges(user_id);
create index if not exists custom_challenges_user_idx on public.custom_challenges(user_id);
create index if not exists focus_sessions_user_idx    on public.focus_sessions(user_id, completed_on);
create index if not exists tasks_goal_idx             on public.tasks(goal_id);
create index if not exists tasks_domain_idx           on public.tasks(domain_id);
create index if not exists tasks_challenge_idx        on public.tasks(challenge_active_id);

-- ── 2. Règles RLS ─────────────────────────────────────────────────────────────────────────────
-- (select auth.uid()) est évalué une seule fois par requête au lieu d'une fois par ligne.
-- Les tables qui pointent vers d'autres tables vérifient en plus que la ligne liée appartient bien à l'utilisateur.

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for all
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "own domains" on public.domains;
create policy "own domains" on public.domains for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "own goals" on public.goals;
create policy "own goals" on public.goals for all
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.domains d where d.id = domain_id and d.user_id = (select auth.uid()))
  );

drop policy if exists "own active" on public.active_challenges;
create policy "own active" on public.active_challenges for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "own tasks" on public.tasks;
create policy "own tasks" on public.tasks for all
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (domain_id is null or exists (select 1 from public.domains d where d.id = domain_id and d.user_id = (select auth.uid())))
    and (goal_id is null or exists (select 1 from public.goals g where g.id = goal_id and g.user_id = (select auth.uid())))
    and (challenge_active_id is null or exists (select 1 from public.active_challenges a where a.id = challenge_active_id and a.user_id = (select auth.uid())))
  );

drop policy if exists "own custom" on public.custom_challenges;
create policy "own custom" on public.custom_challenges for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "own rest days" on public.rest_days;
create policy "own rest days" on public.rest_days for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "own focus" on public.focus_sessions;
create policy "own focus" on public.focus_sessions for all
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (task_id is null or exists (select 1 from public.tasks t where t.id = task_id and t.user_id = (select auth.uid())))
  );

-- ── 3. Contraintes de valeurs ─────────────────────────────────────────────────────────────────
-- "not valid" : s'applique aux nouvelles lignes sans échouer sur d'éventuelles anciennes lignes hors limites.
-- Pour contrôler aussi l'existant, lancez ensuite : alter table public.<table> validate constraint <nom>;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'tasks_xp_range') then
    alter table public.tasks add constraint tasks_xp_range check (xp_value between 0 and 500) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'tasks_title_len') then
    alter table public.tasks add constraint tasks_title_len check (char_length(title) between 1 and 200) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'tasks_duration_len') then
    alter table public.tasks add constraint tasks_duration_len check (duration is null or char_length(duration) <= 40) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'domains_name_len') then
    alter table public.domains add constraint domains_name_len check (char_length(name) between 1 and 80) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'domains_color_fmt') then
    alter table public.domains add constraint domains_color_fmt check (color ~ '^#[0-9a-fA-F]{6}$') not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'goals_title_len') then
    alter table public.goals add constraint goals_title_len check (char_length(title) between 1 and 200) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'goals_description_len') then
    alter table public.goals add constraint goals_description_len check (description is null or char_length(description) <= 2000) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'active_color_fmt') then
    alter table public.active_challenges add constraint active_color_fmt check (color ~ '^#[0-9a-fA-F]{6}$') not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'custom_title_len') then
    alter table public.custom_challenges add constraint custom_title_len check (char_length(title) between 1 and 200) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'custom_color_fmt') then
    alter table public.custom_challenges add constraint custom_color_fmt check (color ~ '^#[0-9a-fA-F]{6}$') not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'focus_minutes_range') then
    alter table public.focus_sessions add constraint focus_minutes_range check (minutes between 1 and 600) not valid;
  end if;
end $$;
