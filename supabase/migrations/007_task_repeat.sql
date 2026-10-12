-- FocusFlow — migration 007 : mémoriser la règle de répétition d'une tâche.
-- À exécuter UNE FOIS dans Supabase > SQL Editor. Rejouable sans danger.
-- Toutes les occurrences d'une série partagent le même `repeat` (fréquence + jours choisis),
-- ce qui permet de modifier la répétition (nombre de jours / date de fin) après création.

alter table public.tasks add column if not exists repeat jsonb;
