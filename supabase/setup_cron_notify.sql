-- FocusFlow — planification des notifications (à exécuter UNE FOIS dans Supabase > SQL Editor).
-- Décrit ici pour être rejouable : extensions, secret partagé et tâche planifiée.
--
-- Étapes :
--   1. Remplacez l'URL placeholder ci-dessous par celle de votre site Vercel.
--   2. Exécutez tout le fichier (il active pg_cron et pg_net s'ils manquent).
--      Si l'activation des extensions est refusée en SQL, activez-les via
--      Dashboard → Integrations → Cron (pg_cron) et Database → Extensions (pg_net), puis relancez.
--   3. La dernière requête affiche le secret : copiez-le dans Vercel > Settings > Environment
--      Variables sous le nom CRON_SECRET, puis redéployez.
--
-- pg_cron appelle toutes les 10 minutes la fonction Vercel /api/notify : le rappel part donc
-- dans les ~10 minutes suivant l'heure choisie.

-- 1. Extensions PostgreSQL ----------------------------------------------------------------------
-- pg_cron doit être installé dans pg_catalog (exigence Supabase) ; il crée ensuite le schéma « cron ».
create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

-- pg_net : appels HTTP sortants depuis PostgreSQL.
create extension if not exists pg_net with schema extensions;

-- 2. Secret partagé avec la fonction Vercel -----------------------------------------------------
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'focusflow_cron_secret') then
    perform vault.create_secret(
      gen_random_uuid()::text,
      'focusflow_cron_secret',
      'Secret partagé avec la fonction Vercel api/notify'
    );
  end if;
end $$;

-- 3. Tâche planifiée (remplace la précédente si elle existe) ------------------------------------
-- Message explicite si pg_cron n'est pas activee : le SQL seul ne peut pas toujours le faire.
do $$
begin
  if not exists (select 1 from pg_namespace where nspname = 'cron') then
    raise exception 'pg_cron n''est pas activee. Ouvrez Dashboard > Integrations > Cron, activez pg_cron, puis relancez ce script.';
  end if;
end $$;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'focusflow-notify') then
    perform cron.unschedule('focusflow-notify');
  end if;
end $$;

select cron.schedule(
  'focusflow-notify',
  '*/10 * * * *',
  $job$
  select extensions.net.http_post(
    url := 'https://focus-flow-henna-seven.vercel.app/api/notify',
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'authorization', 'Bearer ' || (select secret from vault.decrypted_secrets where name = 'focusflow_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 25000
  );
  $job$
);

-- 4. À copier dans Vercel (variable CRON_SECRET) ------------------------------------------------
select secret as cron_secret from vault.decrypted_secrets where name = 'focusflow_cron_secret';

-- Vérifs utiles :
--   select * from cron.job where jobname = 'focusflow-notify';
--   select * from cron.job_run_details order by start_time desc limit 10;
