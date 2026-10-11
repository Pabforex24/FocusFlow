-- FocusFlow — migration 004 : icône des challenges personnels (à exécuter UNE FOIS dans Supabase > SQL Editor).
-- Rejouable sans danger (add column if not exists).
-- Permet de choisir une icône (clé Lucide, ex. "dumbbell") à la création d'un challenge perso.

alter table public.custom_challenges
  add column if not exists icon text not null default 'flag';
