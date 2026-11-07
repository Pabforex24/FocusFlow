-- FocusFlow — migration 011 : durcissement des défis partagés.
-- À exécuter UNE FOIS dans Supabase > SQL Editor. Rejouable sans danger.
--
-- Un défi ne peut être rejoint que jusqu'à son jour de démarrage. Le client appliquait
-- déjà cette règle, mais l'appel RPC restait ouvert : un utilisateur connaissant le code
-- pouvait rejoindre un défi commencé et rattraper les tâches passées.

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
  v_today   date;
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

  -- Même règle que le client : on ne rejoint pas un défi déjà commencé.
  select (now() at time zone coalesce(nullif(btrim(p.timezone), ''), 'UTC'))::date
    into v_today
    from public.profiles p
   where p.id = v_uid;
  v_today := coalesce(v_today, current_date);
  if v_today > v_group.start_date then
    raise exception 'Ce défi a déjà commencé.';
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
