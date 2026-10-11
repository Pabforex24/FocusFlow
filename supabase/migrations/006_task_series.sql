-- FocusFlow — migration 006 : identifiant de série pour les tâches récurrentes.
-- À exécuter UNE FOIS dans Supabase > SQL Editor. Rejouable sans danger.
-- Chaque occurrence d'une tâche récurrente créée d'un coup partage le même series_id,
-- ce qui permet de supprimer toute la série (toutes les occurrences) d'un coup.

alter table public.tasks add column if not exists series_id uuid;

create index if not exists tasks_series_idx on public.tasks(series_id) where series_id is not null;
