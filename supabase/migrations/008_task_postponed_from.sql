-- FocusFlow — migration 008 : mémoriser le jour d'origine d'une tâche reportée.
-- À exécuter UNE FOIS dans Supabase > SQL Editor. Rejouable sans danger.
-- Quand une tâche encore non faite quitte un jour déjà passé (report/rattrapage), on garde la date
-- quittée dans `postponed_from` : la sanction du jour manqué reste acquise même après déplacement,
-- sinon le report suffirait à effacer la pénalité.

alter table public.tasks add column if not exists postponed_from date;
