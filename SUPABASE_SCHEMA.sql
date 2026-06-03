-- ============================================================
-- FocusFlow — Schéma Supabase complet
-- À coller dans : Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- ─── Extensions ─────────────────────────────────────────────
-- (uuid-ossp est déjà activé par défaut sur Supabase)

-- ─── Profiles ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name          TEXT,
  xp                    INTEGER   NOT NULL DEFAULT 0,
  level                 INTEGER   NOT NULL DEFAULT 1,
  streak_count          INTEGER   NOT NULL DEFAULT 0,
  last_active           TEXT,
  longest_streak        INTEGER   NOT NULL DEFAULT 0,
  total_tasks_done      INTEGER   NOT NULL DEFAULT 0,
  challenges_done       INTEGER   NOT NULL DEFAULT 0,
  hardcore_mode         BOOLEAN   NOT NULL DEFAULT false,
  badges                JSONB     NOT NULL DEFAULT '[]',
  catalogue_overrides   JSONB     NOT NULL DEFAULT '{}',
  deleted_catalogue_ids JSONB     NOT NULL DEFAULT '[]',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Crée automatiquement un profil vide à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── Domains ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.domains (
  id         TEXT PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  icon       TEXT NOT NULL DEFAULT 'Target',
  color      TEXT NOT NULL DEFAULT '#7B61FF',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS domains_user_id_idx ON public.domains(user_id);

-- ─── Goals ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.goals (
  id           TEXT PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain_id    TEXT REFERENCES public.domains(id) ON DELETE SET NULL,
  challenge_id TEXT,
  title        TEXT NOT NULL,
  description  TEXT,
  unit         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS goals_user_id_idx ON public.goals(user_id);

-- ─── Tasks ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tasks (
  id                  TEXT PRIMARY KEY,
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain_id           TEXT REFERENCES public.domains(id) ON DELETE SET NULL,
  goal_id             TEXT REFERENCES public.goals(id) ON DELETE SET NULL,
  challenge_active_id TEXT,
  title               TEXT    NOT NULL,
  duration            TEXT,
  scheduled_at        TIMESTAMPTZ NOT NULL,
  done                BOOLEAN NOT NULL DEFAULT false,
  done_at             TIMESTAMPTZ,
  xp_value            INTEGER NOT NULL DEFAULT 10,
  priority            TEXT    CHECK (priority IN ('low', 'medium', 'high')),
  frequency           TEXT    CHECK (frequency IN ('daily', 'workdays', 'weekend', 'custom')),
  custom_days         INTEGER[] NOT NULL DEFAULT '{}',
  is_generated        BOOLEAN NOT NULL DEFAULT false,
  postponed           BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS tasks_user_id_idx       ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS tasks_scheduled_at_idx  ON public.tasks(scheduled_at);
CREATE INDEX IF NOT EXISTS tasks_challenge_act_idx ON public.tasks(challenge_active_id);

-- ─── Custom Challenges ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.custom_challenges (
  id            TEXT PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  duration_days INTEGER NOT NULL DEFAULT 7,
  deadline      DATE,
  color         TEXT NOT NULL DEFAULT '#7B61FF',
  icon          TEXT NOT NULL DEFAULT 'Target',
  blueprints    JSONB NOT NULL DEFAULT '[]',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS custom_challenges_user_id_idx ON public.custom_challenges(user_id);

-- ─── Active Challenges ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.active_challenges (
  id           TEXT PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL,
  start_date   TIMESTAMPTZ NOT NULL,
  end_date     TIMESTAMPTZ NOT NULL,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  current_day  INTEGER NOT NULL DEFAULT 1,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS active_challenges_user_id_idx ON public.active_challenges(user_id);

-- ─── updated_at auto-trigger ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','domains','goals','tasks','custom_challenges','active_challenges'] LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS set_updated_at ON public.%I;
      CREATE TRIGGER set_updated_at
        BEFORE UPDATE ON public.%I
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    ', t, t);
  END LOOP;
END $$;

-- ─── Row Level Security (RLS) ────────────────────────────────
-- Chaque utilisateur ne peut accéder qu'à ses propres données.

ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domains           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_challenges ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "profiles: lecture own"    ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles: modification"   ON public.profiles FOR ALL    USING (auth.uid() = id);

-- domains
CREATE POLICY "domains: own"             ON public.domains  FOR ALL    USING (auth.uid() = user_id);

-- goals
CREATE POLICY "goals: own"               ON public.goals    FOR ALL    USING (auth.uid() = user_id);

-- tasks
CREATE POLICY "tasks: own"               ON public.tasks    FOR ALL    USING (auth.uid() = user_id);

-- custom_challenges
CREATE POLICY "custom_challenges: own"   ON public.custom_challenges FOR ALL USING (auth.uid() = user_id);

-- active_challenges
CREATE POLICY "active_challenges: own"   ON public.active_challenges FOR ALL USING (auth.uid() = user_id);

-- ─── Fin du schéma ───────────────────────────────────────────
-- Vérification rapide après exécution :
--   SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
