-- FocusFlow — planification des notifications (à exécuter UNE FOIS dans Supabase > SQL Editor).
-- Décrit ici pour être rejouable : l'extension, le secret partagé et la tâche planifiée.
--
-- Étapes :
--   1. Remplacez l'URL placeholder ci-dessous par celle de votre site Vercel.
--   2. Exécutez tout le fichier.
--   3. La dernière requête affiche le secret : copiez-le dans Vercel > Settings > Environment
--      Variables sous le nom CRON_SECRET, puis redéployez.
--
-- pg_cron (extension déjà active sur Supabase) appelle toutes les 10 minutes la fonction
-- Vercel /api/notify. Le rappel part donc dans les ~10 minutes suivant l'heure choisie.

-- 1. Requêtes HTTP depuis PostgreSQL ----------------------------------------------------------
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
    url := 'https://REMPLACER-PAR-TON-PROJET.vercel.app/api/notify',
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
