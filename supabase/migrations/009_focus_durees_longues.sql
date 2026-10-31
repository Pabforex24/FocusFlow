-- FocusFlow — migration 009 : sessions Focus jusqu'à 23 h 59 min 59 s.
-- À exécuter UNE FOIS dans Supabase > SQL Editor. Rejouable sans danger.
-- La colonne reste un entier de minutes ; l'app enregistre l'arrondi supérieur, donc 23:59:59 = 1440 minutes.
-- Aucune donnée existante n'est supprimée ou modifiée.

alter table public.focus_sessions drop constraint if exists focus_minutes_range;
alter table public.focus_sessions
  add constraint focus_minutes_range check (minutes between 1 and 1440) not valid;
alter table public.focus_sessions validate constraint focus_minutes_range;
