-- FocusFlow — migration 002 : enregistrement atomique d'une session Focus (à exécuter UNE FOIS dans Supabase > SQL Editor).
-- Rejouable sans danger : la fonction est recréée à l'identique (create or replace).
-- Avant : le client insérait la session puis cochait la tâche liée en DEUX requêtes ; si la seconde
-- échouait, la session était créditée (+30 XP) sans que la tâche ne soit cochée. La fonction en
-- réunit les deux dans une seule transaction, sous les politiques RLS de l'utilisateur
-- (security invoker : aucune élévation de privilège, la politique « own focus » valide le lien tâche).

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

-- Seul un utilisateur connecté peut l'appeler (elle sert auth.uid() de toute façon).
revoke execute on function public.record_focus_session(integer, uuid, date) from public, anon;
grant execute on function public.record_focus_session(integer, uuid, date) to authenticated;
