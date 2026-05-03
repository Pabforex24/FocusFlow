# FocusFlow × Supabase — Guide d'intégration

> Ce guide couvre tout le nécessaire pour passer FocusFlow de son mode
> **100 % localStorage** à une persistance **Supabase** complète avec
> authentification, synchronisation multi-appareils et Row Level Security.

---

## Table des matières

1. [Prérequis](#1-prérequis)
2. [Créer le projet Supabase](#2-créer-le-projet-supabase)
3. [Variables d'environnement](#3-variables-denvironnement)
4. [Appliquer le schéma SQL](#4-appliquer-le-schéma-sql)
5. [Migrations requises](#5-migrations-requises)
6. [Activer l'authentification](#6-activer-lauthentification)
7. [Connecter le store Zustand](#7-connecter-le-store-zustand)
8. [Fichier db.ts — couche d'accès](#8-fichier-dbts--couche-daccès)
9. [Adapter le store action par action](#9-adapter-le-store-action-par-action)
10. [Gestion du seed data](#10-gestion-du-seed-data)
11. [Synchronisation au démarrage](#11-synchronisation-au-démarrage)
12. [Bugs ouverts à corriger avant la migration](#12-bugs-ouverts-à-corriger-avant-la-migration)
13. [Checklist de déploiement Supabase](#13-checklist-de-déploiement-supabase)
14. [Remplacer Anthropic par Groq](#14-remplacer-anthropic-par-groq)
15. [Déploiement sur Vercel](#15-déploiement-sur-vercel)
16. [Checklist de mise en production finale](#16-checklist-de-mise-en-production-finale)

---

## 1. Prérequis

- Node.js ≥ 18
- Compte Supabase (gratuit suffit pour commencer)
- `@supabase/supabase-js` déjà installé dans le projet (`package.json`)
- Next.js 14 avec App Router (déjà en place)

---

## 2. Créer le projet Supabase

1. Aller sur [supabase.com](https://supabase.com) → **New project**
2. Choisir une région proche de vos utilisateurs (ex. `eu-west-1` pour l'Europe)
3. Sauvegarder le mot de passe de la base — vous en aurez besoin pour les migrations
4. Attendre ~2 minutes que le projet soit prêt

Dans **Settings → API**, récupérer :
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (uniquement côté serveur, **ne jamais exposer côté client**)

---

## 3. Variables d'environnement

Créer `.env.local` à la racine du projet :

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Uniquement pour les routes API serveur (coach IA, migrations)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Déjà présent dans le projet
ANTHROPIC_API_KEY=sk-ant-...
```

> `.env.local` est ignoré par Git. Ne jamais committer les clés.

Vérifier que `src/lib/supabase.ts` est bien configuré — le fichier est déjà
présent dans le projet :

```typescript
// src/lib/supabase.ts — déjà en place, aucune modification requise
import { createClient } from '@supabase/supabase-js'

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL     || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey
```

---

## 4. Appliquer le schéma SQL

Le fichier `src/lib/schema.sql` contient le schéma complet. Pour l'appliquer :

### Option A — Éditeur SQL de Supabase (recommandé pour débuter)

1. Dans le dashboard Supabase → **SQL Editor** → **New query**
2. Coller le contenu de `src/lib/schema.sql`
3. Cliquer **Run**

### Option B — Supabase CLI

```bash
# Installer la CLI
npm install -g supabase

# Se connecter
supabase login

# Lier votre projet (remplacer par votre project-ref)
supabase link --project-ref xxxxxxxxxxxx

# Appliquer le schéma
supabase db push
```

### Tables créées par le schéma

| Table | Description |
|-------|-------------|
| `profiles` | Étend `auth.users` — streak, last_active |
| `domains` | Domaines de l'utilisateur |
| `goals` | Objectifs (sans deadline dans la v3) |
| `sub_goals` | Sous-objectifs (optionnel) |
| `tasks` | Tâches planifiées |
| `challenges` | Définitions de challenges |
| `challenge_blueprints` | Modèles de tâches d'un challenge |
| `active_challenges` | Instances de challenges par utilisateur |

Toutes les tables ont **Row Level Security (RLS)** activé — chaque utilisateur
ne voit que ses propres données.

---

## 5. Migrations requises

Le schéma original a été conçu avant plusieurs évolutions du modèle de données.
Appliquer ces migrations **avant** de connecter le store.

### Migration 1 — Supprimer `deadline` de `goals`

```sql
-- Les objectifs sont des cibles globales sans échéance (v3)
ALTER TABLE public.goals DROP COLUMN IF EXISTS deadline;

-- Ajouter le champ unit (ex: "heures", "séances")
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS unit text;
```

### Migration 2 — Colonnes manquantes sur `tasks`

```sql
-- Lien explicite vers un active_challenge
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS challenge_active_id uuid
    REFERENCES public.active_challenges(id) ON DELETE SET NULL;

-- Fréquence des tâches de challenge
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS frequency text
    CHECK (frequency IN ('daily', 'workdays', 'weekend', 'custom'));

-- Jours personnalisés (array d'entiers 0-6)
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS custom_days integer[];

-- Marqueur tâche auto-générée par un challenge
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS is_generated boolean DEFAULT false;

-- Priorité
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS priority text
    CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium';

-- XP
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS xp_value integer DEFAULT 10;

CREATE INDEX IF NOT EXISTS tasks_challenge_active_id_idx
  ON public.tasks(challenge_active_id);
```

### Migration 3 — `goals` liés à un challenge

```sql
-- Un objectif peut être lié à un challenge (sans deadline dans ce cas)
ALTER TABLE public.goals
  ADD COLUMN IF NOT EXISTS challenge_id uuid
    REFERENCES public.challenges(id) ON DELETE SET NULL;
```

### Migration 4 — `challenge_blueprints` avec fréquence et goalId

```sql
ALTER TABLE public.challenge_blueprints
  ADD COLUMN IF NOT EXISTS goal_id uuid
    REFERENCES public.goals(id) ON DELETE SET NULL;

ALTER TABLE public.challenge_blueprints
  ADD COLUMN IF NOT EXISTS frequency text
    CHECK (frequency IN ('daily', 'workdays', 'weekend', 'custom'))
    DEFAULT 'daily';

ALTER TABLE public.challenge_blueprints
  ADD COLUMN IF NOT EXISTS custom_days integer[];
```

### Migration 5 — Challenges custom utilisateur

```sql
-- Les challenges peuvent être créés par les utilisateurs (custom)
ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS user_id uuid
    REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS deadline date;

ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS is_catalogue boolean DEFAULT true;

-- RLS pour les challenges custom
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Catalogue visible par tous"
  ON public.challenges FOR SELECT
  USING (is_catalogue = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage their own challenges"
  ON public.challenges FOR ALL
  USING (auth.uid() = user_id);
```

### Migration 6 — Gamification

```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS xp integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS total_tasks_done integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS challenges_completed integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hardcore_mode boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS badges jsonb DEFAULT '[]'::jsonb;
```

---

## 6. Activer l'authentification

### Dans le dashboard Supabase

1. **Authentication → Providers** → activer **Email** (activé par défaut)
2. Pour Google OAuth (optionnel) :
   - Activer **Google** dans Providers
   - Renseigner `Client ID` et `Client Secret` depuis Google Cloud Console
   - Ajouter `https://xxxxxxxxxxxx.supabase.co/auth/v1/callback` comme redirect URI dans Google

### Créer le trigger de profil automatique

Chaque nouvel utilisateur doit avoir un profil créé automatiquement :

```sql
-- Fonction déclenchée à la création d'un utilisateur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sur auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Ajouter les pages d'auth dans Next.js

Créer `src/app/auth/page.tsx` :

```typescript
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode]         = useState<'login' | 'signup'>('login')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async () => {
    if (!supabase) return
    setLoading(true)
    setError('')

    const { error } = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
    } else {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm p-6 bg-bg-2 border border-border-2 rounded-2xl">
        <h1 className="font-heading font-bold text-xl mb-6">
          {mode === 'login' ? 'Connexion' : 'Créer un compte'}
        </h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-3 bg-bg-3 border border-border rounded-xl px-3 py-2 text-sm text-content outline-none focus:border-accent"
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 bg-bg-3 border border-border rounded-xl px-3 py-2 text-sm text-content outline-none focus:border-accent"
        />
        {error && <p className="text-danger text-xs mb-3">{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-accent text-white rounded-xl py-2 text-sm font-semibold disabled:opacity-50"
        >
          {loading ? 'Chargement…' : mode === 'login' ? 'Se connecter' : "S'inscrire"}
        </button>
        <button
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          className="w-full mt-3 text-xs text-content-3 hover:text-content"
        >
          {mode === 'login' ? "Pas de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
        </button>
      </div>
    </div>
  )
}
```

### Protéger les routes dans le middleware

Créer `src/middleware.ts` :

```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res      = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const { data: { session } } = await supabase.auth.getSession()

  // Routes protégées
  const protectedPaths = ['/dashboard', '/domains', '/goals', '/tasks', '/challenges', '/coach']
  const isProtected    = protectedPaths.some((p) => req.nextUrl.pathname.startsWith(p))

  if (isProtected && !session) {
    return NextResponse.redirect(new URL('/auth', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
```

Installer le package helper :

```bash
npm install @supabase/auth-helpers-nextjs
```

---

## 7. Connecter le store Zustand

La stratégie recommandée est une **migration progressive** :
le store Zustand reste la source de vérité locale, et chaque action
envoie les changements à Supabase en arrière-plan (fire and forget).

En cas d'erreur réseau, les données restent dans localStorage. Une
synchronisation complète est déclenchée au prochain démarrage.

### Pattern général pour chaque action

```typescript
// Avant (localStorage uniquement)
addDomain: (data) =>
  set((s) => ({ domains: [...s.domains, { ...data, id: uid(), createdAt: new Date().toISOString() }] })),

// Après (localStorage + Supabase)
addDomain: async (data) => {
  const newDomain = { ...data, id: uid(), createdAt: new Date().toISOString() }
  
  // 1. Mise à jour locale immédiate (UI réactive)
  set((s) => ({ domains: [...s.domains, newDomain] }))
  
  // 2. Persistance Supabase en arrière-plan
  if (isSupabaseConfigured && supabase) {
    const userId = (await supabase.auth.getUser()).data.user?.id
    if (userId) {
      await supabase.from('domains').insert({
        id:         newDomain.id,
        user_id:    userId,
        name:       newDomain.name,
        icon:       newDomain.icon,
        color:      newDomain.color,
        created_at: newDomain.createdAt,
      })
    }
  }
},
```

---

## 8. Fichier db.ts — couche d'accès

Créer `src/lib/db.ts` pour centraliser toutes les requêtes Supabase :

```typescript
// src/lib/db.ts
import { supabase } from './supabase'
import { Domain, Goal, Task, Challenge, ActiveChallenge } from '@/types'

// ── Helper : récupérer l'userId courant ────────────────────────────────────────
export async function getCurrentUserId(): Promise<string | null> {
  if (!supabase) return null
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}

// ── Domains ────────────────────────────────────────────────────────────────────
export const db = {
  domains: {
    async fetchAll(userId: string): Promise<Domain[]> {
      if (!supabase) return []
      const { data, error } = await supabase
        .from('domains')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
      if (error) { console.error('[db.domains.fetchAll]', error); return [] }
      return (data || []).map((d) => ({
        id:        d.id,
        name:      d.name,
        icon:      d.icon,
        color:     d.color,
        createdAt: d.created_at,
      }))
    },

    async insert(userId: string, domain: Domain): Promise<void> {
      if (!supabase) return
      const { error } = await supabase.from('domains').insert({
        id:         domain.id,
        user_id:    userId,
        name:       domain.name,
        icon:       domain.icon,
        color:      domain.color,
        created_at: domain.createdAt,
      })
      if (error) console.error('[db.domains.insert]', error)
    },

    async update(id: string, data: Partial<Domain>): Promise<void> {
      if (!supabase) return
      const { error } = await supabase.from('domains').update({
        name:  data.name,
        icon:  data.icon,
        color: data.color,
      }).eq('id', id)
      if (error) console.error('[db.domains.update]', error)
    },

    async delete(id: string): Promise<void> {
      if (!supabase) return
      const { error } = await supabase.from('domains').delete().eq('id', id)
      if (error) console.error('[db.domains.delete]', error)
    },
  },

  // ── Goals ──────────────────────────────────────────────────────────────────
  goals: {
    async fetchAll(userId: string): Promise<Goal[]> {
      if (!supabase) return []
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
      if (error) { console.error('[db.goals.fetchAll]', error); return [] }
      return (data || []).map((g) => ({
        id:          g.id,
        domainId:    g.domain_id,
        title:       g.title,
        description: g.description ?? '',
        unit:        g.unit ?? '',
        challengeId: g.challenge_id ?? undefined,
        createdAt:   g.created_at,
      }))
    },

    async insert(userId: string, goal: Goal): Promise<void> {
      if (!supabase) return
      const { error } = await supabase.from('goals').insert({
        id:           goal.id,
        user_id:      userId,
        domain_id:    goal.domainId,
        title:        goal.title,
        description:  goal.description ?? null,
        unit:         goal.unit ?? null,
        challenge_id: goal.challengeId ?? null,
        created_at:   goal.createdAt,
      })
      if (error) console.error('[db.goals.insert]', error)
    },

    async update(id: string, data: Partial<Goal>): Promise<void> {
      if (!supabase) return
      const { error } = await supabase.from('goals').update({
        title:       data.title,
        description: data.description,
        unit:        data.unit,
      }).eq('id', id)
      if (error) console.error('[db.goals.update]', error)
    },

    async delete(id: string): Promise<void> {
      if (!supabase) return
      const { error } = await supabase.from('goals').delete().eq('id', id)
      if (error) console.error('[db.goals.delete]', error)
    },
  },

  // ── Tasks ──────────────────────────────────────────────────────────────────
  tasks: {
    async fetchAll(userId: string): Promise<Task[]> {
      if (!supabase) return []
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('scheduled_at', { ascending: true })
      if (error) { console.error('[db.tasks.fetchAll]', error); return [] }
      return (data || []).map((t) => ({
        id:                t.id,
        title:             t.title,
        domainId:          t.domain_id ?? undefined,
        goalId:            t.goal_id   ?? undefined,
        challengeActiveId: t.challenge_active_id ?? undefined,
        duration:          t.duration  ?? undefined,
        scheduledAt:       t.scheduled_at,
        done:              t.done,
        doneAt:            t.done_at   ?? undefined,
        xpValue:           t.xp_value  ?? 10,
        priority:          t.priority  ?? 'medium',
        frequency:         t.frequency ?? undefined,
        customDays:        t.custom_days ?? undefined,
        isGenerated:       t.is_generated ?? false,
        createdAt:         t.created_at,
      }))
    },

    async insert(userId: string, task: Task): Promise<void> {
      if (!supabase) return
      const { error } = await supabase.from('tasks').insert({
        id:                   task.id,
        user_id:              userId,
        domain_id:            task.domainId    ?? null,
        goal_id:              task.goalId      ?? null,
        challenge_active_id:  task.challengeActiveId ?? null,
        title:                task.title,
        duration:             task.duration    ?? null,
        scheduled_at:         task.scheduledAt,
        done:                 task.done,
        done_at:              task.doneAt      ?? null,
        xp_value:             task.xpValue     ?? 10,
        priority:             task.priority    ?? 'medium',
        frequency:            task.frequency   ?? null,
        custom_days:          task.customDays  ?? null,
        is_generated:         task.isGenerated ?? false,
        created_at:           task.createdAt,
      })
      if (error) console.error('[db.tasks.insert]', error)
    },

    async bulkInsert(userId: string, tasks: Task[]): Promise<void> {
      if (!supabase || !tasks.length) return
      const { error } = await supabase.from('tasks').insert(
        tasks.map((t) => ({
          id:                   t.id,
          user_id:              userId,
          domain_id:            t.domainId    ?? null,
          goal_id:              t.goalId      ?? null,
          challenge_active_id:  t.challengeActiveId ?? null,
          title:                t.title,
          duration:             t.duration    ?? null,
          scheduled_at:         t.scheduledAt,
          done:                 false,
          xp_value:             t.xpValue     ?? 20,
          priority:             t.priority    ?? 'medium',
          frequency:            t.frequency   ?? null,
          custom_days:          t.customDays  ?? null,
          is_generated:         t.isGenerated ?? true,
          created_at:           t.createdAt,
        }))
      )
      if (error) console.error('[db.tasks.bulkInsert]', error)
    },

    async toggle(id: string, done: boolean, doneAt?: string): Promise<void> {
      if (!supabase) return
      const { error } = await supabase.from('tasks').update({
        done,
        done_at: done ? (doneAt ?? new Date().toISOString()) : null,
      }).eq('id', id)
      if (error) console.error('[db.tasks.toggle]', error)
    },

    async delete(id: string): Promise<void> {
      if (!supabase) return
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (error) console.error('[db.tasks.delete]', error)
    },

    async deleteByActiveChallenge(acId: string): Promise<void> {
      if (!supabase) return
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('challenge_active_id', acId)
        .eq('done', false)
        .gt('scheduled_at', new Date().toISOString())
      if (error) console.error('[db.tasks.deleteByActiveChallenge]', error)
    },
  },

  // ── Active Challenges ──────────────────────────────────────────────────────
  activeChallenges: {
    async fetchAll(userId: string): Promise<ActiveChallenge[]> {
      if (!supabase) return []
      const { data, error } = await supabase
        .from('active_challenges')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) { console.error('[db.activeChallenges.fetchAll]', error); return [] }
      return (data || []).map((ac) => ({
        id:          ac.id,
        challengeId: ac.challenge_id,
        startDate:   ac.start_date,
        endDate:     ac.end_date,
        isActive:    ac.is_active,
        currentDay:  1,
        createdAt:   ac.created_at,
      }))
    },

    async insert(userId: string, ac: ActiveChallenge): Promise<void> {
      if (!supabase) return
      const { error } = await supabase.from('active_challenges').insert({
        id:           ac.id,
        user_id:      userId,
        challenge_id: ac.challengeId,
        start_date:   ac.startDate,
        end_date:     ac.endDate,
        is_active:    ac.isActive,
        created_at:   ac.createdAt,
      })
      if (error) console.error('[db.activeChallenges.insert]', error)
    },

    async deactivate(id: string): Promise<void> {
      if (!supabase) return
      const { error } = await supabase
        .from('active_challenges')
        .update({ is_active: false })
        .eq('id', id)
      if (error) console.error('[db.activeChallenges.deactivate]', error)
    },
  },

  // ── Profile / Stats ────────────────────────────────────────────────────────
  profile: {
    async upsertStats(userId: string, stats: {
      xp: number; level: number; streak: number; lastActive: string | null;
      totalTasksDone: number; longestStreak: number; hardcoreMode: boolean;
      badges: unknown[];
    }): Promise<void> {
      if (!supabase) return
      const { error } = await supabase.from('profiles').upsert({
        id:                  userId,
        xp:                  stats.xp,
        level:               stats.level,
        streak_count:        stats.streak,
        last_active:         stats.lastActive,
        total_tasks_done:    stats.totalTasksDone,
        longest_streak:      stats.longestStreak,
        hardcore_mode:       stats.hardcoreMode,
        badges:              stats.badges,
      })
      if (error) console.error('[db.profile.upsertStats]', error)
    },
  },
}
```

---

## 9. Adapter le store action par action

Modifier `src/store/index.ts` pour appeler `db.*` après chaque mutation locale.
Voici les patterns pour chaque groupe d'actions :

### addDomain / updateDomain / deleteDomain

```typescript
addDomain: async (data) => {
  const newDomain = { ...data, id: uid(), createdAt: new Date().toISOString() }
  set((s) => ({ domains: [...s.domains, newDomain] }))
  const userId = await getCurrentUserId()
  if (userId) await db.domains.insert(userId, newDomain)
},

updateDomain: async (id, data) => {
  set((s) => ({ domains: s.domains.map((d) => d.id === id ? { ...d, ...data } : d) }))
  await db.domains.update(id, data)
},

deleteDomain: async (id) => {
  // ... logique cascade locale existante ...
  await db.domains.delete(id)
},
```

### toggleTask

```typescript
toggleTask: async (id) => {
  // ... logique locale existante (XP, streak, badges) ...
  const task = get().tasks.find((t) => t.id === id)
  if (task) await db.tasks.toggle(id, !task.done)
},
```

### startChallenge

```typescript
startChallenge: async (challengeId, blueprintGoalMap = {}) => {
  // ... logique locale existante (buildAllTasks, newAC) ...

  const userId = await getCurrentUserId()
  if (userId) {
    await db.activeChallenges.insert(userId, newAC)
    await db.tasks.bulkInsert(userId, allTasks.map((t) => ({
      ...t, id: uid(), createdAt: new Date().toISOString()
    })))
  }
},
```

---

## 10. Gestion du seed data

Les IDs seed (`seed-d1`, `seed-g1`, etc.) **ne sont pas des UUID valides** pour
Postgres. Deux options :

### Option A — Conserver le seed local (recommandé pour l'instant)

Le seed reste uniquement dans localStorage. Quand l'utilisateur se connecte
pour la première fois, on insère le seed en base avec de vrais UUIDs :

```typescript
// À appeler dans la fonction de synchronisation initiale
async function migrateLocalSeedToSupabase(userId: string) {
  const { domains, goals, tasks } = useStore.getState()

  // Remplacer les IDs seed par de vrais UUIDs
  const idMap: Record<string, string> = {}
  const uuid = () => crypto.randomUUID()

  const migratedDomains = domains
    .filter((d) => d.id.startsWith('seed-'))
    .map((d) => {
      idMap[d.id] = uuid()
      return { ...d, id: idMap[d.id] }
    })

  // Mettre à jour les références dans goals et tasks
  const migratedGoals = goals
    .filter((g) => g.id.startsWith('seed-'))
    .map((g) => ({ ...g, id: uuid(), domainId: idMap[g.domainId] ?? g.domainId }))

  // Insérer en base
  for (const d of migratedDomains) await db.domains.insert(userId, d)
  for (const g of migratedGoals)   await db.goals.insert(userId, g)
}
```

### Option B — Générer des UUIDs dès le départ

Modifier le seed dans `store/index.ts` pour utiliser `crypto.randomUUID()` :

```typescript
// Remplacer
{ id: 'seed-d1', name: 'Trading', ... }

// Par
{ id: typeof crypto !== 'undefined' ? crypto.randomUUID() : uid(), name: 'Trading', ... }
```

> Attention : cela invalide le localStorage existant — bumper la clé du store.

---

## 11. Synchronisation au démarrage

Créer un hook de synchronisation à appeler dans le layout racine :

```typescript
// src/hooks/useSupabaseSync.ts
'use client'

import { useEffect, useRef } from 'react'
import { useStore } from '@/store'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { db, getCurrentUserId } from '@/lib/db'

export function useSupabaseSync() {
  const synced = useRef(false)
  const { domains, goals, tasks, activeChallenges } = useStore()

  useEffect(() => {
    if (!isSupabaseConfigured || synced.current) return

    const syncFromSupabase = async () => {
      const userId = await getCurrentUserId()
      if (!userId) return

      // Charger les données depuis Supabase
      const [remoteDomains, remoteGoals, remoteTasks, remoteAC] = await Promise.all([
        db.domains.fetchAll(userId),
        db.goals.fetchAll(userId),
        db.tasks.fetchAll(userId),
        db.activeChallenges.fetchAll(userId),
      ])

      // Mettre à jour le store si des données existent en base
      if (remoteDomains.length > 0) {
        useStore.setState({
          domains:          remoteDomains,
          goals:            remoteGoals,
          tasks:            remoteTasks,
          activeChallenges: remoteAC,
        })
      }

      synced.current = true
    }

    syncFromSupabase()

    // Écouter les changements en temps réel (optionnel)
    if (supabase) {
      const channel = supabase
        .channel('tasks-changes')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tasks' },
          (payload) => {
            // Mettre à jour la tâche dans le store local
            useStore.setState((s) => ({
              tasks: s.tasks.map((t) =>
                t.id === payload.new.id ? { ...t, done: payload.new.done } : t
              ),
            }))
          }
        )
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    }
  }, [])
}
```

Utiliser dans `src/app/layout.tsx` :

```typescript
// Ajouter dans le composant client wrapper
'use client'
import { useSupabaseSync } from '@/hooks/useSupabaseSync'

function AppWrapper({ children }: { children: React.ReactNode }) {
  useSupabaseSync()
  return <>{children}</>
}
```

---

## 12. Bugs ouverts à corriger avant la migration

D'après le rapport technique, ces points doivent être résolus avant de brancher Supabase :

| Priorité | Problème | Action |
|----------|----------|--------|
| P0 | `overflow-y-auto` sur `<main>` casse les modals | Retirer de `src/app/layout.tsx` |
| P1 | IDs seed non-UUID | Appliquer Option A ou B du §10 |
| P2 | `src/app/progression/page.tsx` existe encore | Supprimer le fichier |
| P3 | `generateTodayChallengeTasks` déclaré dans l'interface mais no-op | Supprimer de `AppStore` et de `src/types/index.ts` |
| P4 | `ChallengeCard.tsx` absent du dépôt | Versionner le fichier |

---

## 13. Checklist de déploiement Supabase

```
□ .env.local créé avec les 3 variables Supabase
□ schema.sql appliqué (SQL Editor ou CLI)
□ Migrations 1 à 6 appliquées dans l'ordre
□ Trigger handle_new_user créé
□ Page /auth créée
□ Middleware de protection des routes en place
□ src/lib/db.ts créé
□ Actions du store adaptées (addDomain, toggleTask, startChallenge en priorité)
□ useSupabaseSync branché dans le layout
□ Test de connexion / inscription
□ Test de création d'un domaine (vérifier dans Supabase Table Editor)
□ Test de toggle d'une tâche
□ Test de lancement d'un challenge (vérifier les tâches générées en base)
□ Vérifier que le RLS bloque bien un utilisateur B d'accéder aux données de A
```

---

## Ressources

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth Helpers for Next.js](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime](https://supabase.com/docs/guides/realtime)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

---

## 14. Remplacer Anthropic par Groq

L'actuel assistant IA (`/api/coach`) utilise l'API Anthropic (`claude-sonnet`).
Groq est une alternative **beaucoup plus rapide** (inférence sur hardware dédié
LPU) et **moins coûteuse** — idéale pour un coach conversationnel en temps réel.

### Pourquoi Groq pour ce projet

| Critère | Anthropic Claude | Groq |
|---------|-----------------|------|
| Vitesse | ~2–4 s / réponse | **< 0.5 s** (LPU) |
| Modèle recommandé | claude-sonnet | **llama-3.3-70b-versatile** |
| Free tier | Limité | **Généreux (14 400 req/jour)** |
| Qualité coaching | Excellente | Très bonne |
| Latence perçue | Visible | Quasi-instantanée |

### Installation

```bash
npm install groq-sdk
```

### Créer un compte et récupérer la clé API

1. Aller sur [console.groq.com](https://console.groq.com)
2. **API Keys** → **Create API Key**
3. Copier la clé — elle ne s'affiche qu'une seule fois

### Ajouter la variable d'environnement

Dans `.env.local` :

```bash
# Remplace ou coexiste avec ANTHROPIC_API_KEY
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Réécrire `src/app/api/coach/route.ts`

```typescript
// src/app/api/coach/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

// Instancier le client une seule fois (module-level)
const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null

// Modèles disponibles sur Groq (du plus rapide au plus puissant)
// - llama-3.1-8b-instant     : ultra-rapide, réponses courtes
// - llama-3.3-70b-versatile  : recommandé pour le coaching (qualité/vitesse)
// - mixtral-8x7b-32768       : bon pour les longues conversations
const MODEL = 'llama-3.3-70b-versatile'

export async function POST(req: NextRequest) {
  const { messages, system } = await req.json()

  // Fallback local si Groq non configuré
  if (!groq) {
    return NextResponse.json({ reply: getLocalFallback(messages) })
  }

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      max_tokens: 400,
      temperature: 0.7,
      messages: [
        // Le system prompt passe en premier message de type 'system'
        { role: 'system', content: system || DEFAULT_SYSTEM_PROMPT },
        // Historique de la conversation
        ...messages.map((m: { role: string; content: string }) => ({
          role:    m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ],
    })

    const reply = completion.choices[0]?.message?.content
      || 'Concentrez-vous sur votre prochain 1% — chaque action compte.'

    return NextResponse.json({ reply })

  } catch (err) {
    console.error('[coach/route] Groq error:', err)
    return NextResponse.json({ reply: getLocalFallback(messages) }, { status: 200 })
  }
}

// ── System prompt par défaut ────────────────────────────────────────────────
const DEFAULT_SYSTEM_PROMPT = `
Tu es un coach de discipline personnelle pour l'application FocusFlow.
Ton rôle est d'aider l'utilisateur à rester focalisé, motivé et discipliné
dans ses objectifs et challenges quotidiens.

Règles :
- Réponses courtes et percutantes (3-5 phrases max)
- Ton direct, bienveillant et factuel — pas de flatterie
- Utilise les données de contexte fournies pour personnaliser tes conseils
- Réponds toujours en français
- Si l'utilisateur mentionne une difficulté spécifique, donne un conseil actionnable immédiat
`.trim()

// ── Fallback local (identique à l'original) ─────────────────────────────────
function getLocalFallback(messages: { role: string; content: string }[]): string {
  const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() || ''

  if (lastMsg.includes('motiv'))
    return "La motivation ne dure pas, mais les habitudes si. Concentrez-vous sur votre prochain 1% et le reste suivra."
  if (lastMsg.includes('procrastin'))
    return "Pour vaincre la procrastination : démarrez avec 2 minutes sur la tâche la plus difficile. L'action crée l'élan, pas l'inverse."
  if (lastMsg.includes('streak') || lastMsg.includes('série'))
    return "Chaque jour compte dans votre série. Une seule tâche complétée suffit à maintenir votre streak — ne cherchez pas la perfection."
  if (lastMsg.includes('objectif') || lastMsg.includes('goal'))
    return "Concentrez-vous sur un seul objectif majeur à la fois. La dispersion est l'ennemi numéro un de la progression."
  if (lastMsg.includes('priorit'))
    return "Utilisez la règle du MIT : choisissez 3 tâches maximum pour aujourd'hui et finissez-les avant tout le reste."
  if (lastMsg.includes('fatigue') || lastMsg.includes('épuis'))
    return "La fatigue est normale. Prévoyez des pauses actives de 5 minutes toutes les heures. Un cerveau reposé est deux fois plus efficace."

  const quotes = [
    "La discipline, c'est choisir entre ce que vous voulez maintenant et ce que vous voulez le plus.",
    "Chaque tâche complétée est une brique de plus dans la construction de votre meilleure version.",
    "Ce n'est pas la motivation qui crée l'action — c'est l'action qui crée la motivation.",
    "Petits progrès quotidiens = résultats extraordinaires à long terme.",
  ]
  return quotes[Math.floor(Math.random() * quotes.length)]
}
```

### Passer le contexte utilisateur depuis la page Coach

La route reçoit déjà un `system` dynamique depuis `src/app/coach/page.tsx`.
S'assurer qu'il inclut les données pertinentes :

```typescript
// src/app/coach/page.tsx — enrichir le system prompt avec le contexte
const buildSystemPrompt = () => {
  const { streak, tasks, goals, activeChallenges } = useStore.getState()
  const todayStr  = new Date().toDateString()
  const todayDone = tasks.filter((t) => t.done && new Date(t.scheduledAt).toDateString() === todayStr).length
  const todayTotal= tasks.filter((t) => new Date(t.scheduledAt).toDateString() === todayStr).length
  const activeAC  = activeChallenges.filter((ac) => ac.isActive)

  return `
Tu es le coach IA de FocusFlow.

Contexte utilisateur :
- Streak actuel : ${streak} jours consécutifs
- Tâches aujourd'hui : ${todayDone}/${todayTotal} complétées
- Objectifs actifs : ${goals.length}
- Challenges en cours : ${activeAC.length}
${activeAC.length > 0 ? `- Noms des challenges : ${activeAC.map(ac => ac.challengeId).join(', ')}` : ''}

Règles :
- Réponses courtes et percutantes (3-5 phrases max)
- Ton direct, bienveillant et factuel
- Utilise le contexte pour personnaliser tes conseils
- Réponds toujours en français
  `.trim()
}
```

### Modèles Groq disponibles en mai 2026

```
llama-3.1-8b-instant       — Ultra-rapide, idéal pour réponses simples
llama-3.3-70b-versatile    — Recommandé ✓ — meilleur rapport qualité/vitesse
llama-3.1-70b-versatile    — Alternative stable
mixtral-8x7b-32768         — Longues conversations (32k context)
gemma2-9b-it               — Compact et efficace
```

Pour changer de modèle, modifier la constante `MODEL` dans `route.ts`.

### Coexistence Anthropic + Groq (optionnel)

Si vous voulez garder les deux et choisir selon la disponibilité :

```typescript
// Priorité : Groq (rapide) → Anthropic (fallback) → local
const useGroq      = !!process.env.GROQ_API_KEY
const useAnthropic = !!process.env.ANTHROPIC_API_KEY

if (useGroq) {
  // appel Groq
} else if (useAnthropic) {
  // appel Anthropic (code original)
} else {
  // fallback local
}
```

---

## 15. Déploiement sur Vercel

Vercel est la plateforme recommandée pour Next.js — déploiement en ~2 minutes,
edge network mondial, preview deployments automatiques.

### Prérequis

- Compte Vercel (gratuit) : [vercel.com](https://vercel.com)
- Dépôt Git (GitHub, GitLab ou Bitbucket) contenant le projet

### Étape 1 — Préparer le dépôt Git

Si le projet n'est pas encore versionné :

```bash
cd focusflow
git init
git add .
git commit -m "feat: initial commit"

# Créer un repo sur GitHub puis :
git remote add origin https://github.com/VOTRE_USERNAME/focusflow.git
git push -u origin main
```

S'assurer que `.gitignore` contient bien :

```
# .gitignore
.env.local
.env*.local
node_modules/
.next/
out/
```

### Étape 2 — Importer sur Vercel

1. Aller sur [vercel.com/new](https://vercel.com/new)
2. **Import Git Repository** → sélectionner votre repo `focusflow`
3. Vercel détecte automatiquement Next.js — **ne pas modifier** le framework preset
4. **Build & Output Settings** — laisser les valeurs par défaut :
   - Build Command : `next build`
   - Output Directory : `.next`
   - Install Command : `npm install`

### Étape 3 — Variables d'environnement

Dans l'interface Vercel, avant de cliquer **Deploy** :

1. Ouvrir **Environment Variables**
2. Ajouter chaque variable une par une :

| Variable | Valeur | Environnements |
|----------|--------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Production, Preview (**pas Development**) |
| `GROQ_API_KEY` | `gsk_...` | Production, Preview, Development |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | Production, Preview *(optionnel si Groq actif)* |

> Les variables `NEXT_PUBLIC_*` sont exposées côté client (browser).
> Les autres restent strictement côté serveur (routes API Next.js).

### Étape 4 — Déployer

Cliquer **Deploy**. Vercel build et déploie en ~90 secondes.

L'URL de production sera de la forme : `https://focusflow-xxx.vercel.app`

### Étape 5 — Configurer un domaine custom (optionnel)

1. **Settings → Domains** → **Add Domain**
2. Entrer votre domaine : `focusflow.votredomaine.com`
3. Ajouter l'enregistrement DNS indiqué chez votre registrar :
   ```
   Type  : CNAME
   Name  : focusflow
   Value : cname.vercel-dns.com
   ```
4. Vercel génère automatiquement un certificat SSL (Let's Encrypt)

### Étape 6 — Mettre à jour les URLs dans Supabase

Après avoir un domaine définitif, mettre à jour dans Supabase :

**Authentication → URL Configuration :**

```
Site URL         : https://focusflow.votredomaine.com
Redirect URLs    : https://focusflow.votredomaine.com/**
                   https://focusflow-*.vercel.app/**   ← pour les previews
```

### Déploiements automatiques

Chaque `git push` sur `main` déclenche un déploiement en production.
Chaque Pull Request crée un **preview deployment** avec une URL unique —
pratique pour tester les changements sans impacter la prod.

```bash
# Workflow recommandé
git checkout -b feat/nouvelle-fonctionnalite
# ... développement ...
git push origin feat/nouvelle-fonctionnalite
# → Vercel crée un preview deployment automatiquement

git checkout main
git merge feat/nouvelle-fonctionnalite
git push
# → Vercel déploie en production
```

### Variables d'environnement en local vs production

Pour le développement local, `.env.local` est utilisé automatiquement par Next.js.
Pour la production et les previews, les variables sont injectées par Vercel.

Si vous avez besoin de différentes clés entre preview et production :

```bash
# Dans Vercel → Environment Variables
# Sélectionner uniquement "Production" pour les clés de prod
# Sélectionner "Preview" pour les clés de staging (ex: base Supabase de test)
```

### Logs et monitoring

Dans le dashboard Vercel :

- **Deployments** → cliquer sur un déploiement → **Build Logs** pour diagnostiquer les erreurs de build
- **Functions** → logs des routes API (`/api/coach`) en temps réel
- **Analytics** (Vercel Pro) → Core Web Vitals, visiteurs

Pour les logs des routes API en local :

```bash
npm run dev
# Les console.error() des routes API apparaissent dans le terminal
```

### Optimisations Next.js pour Vercel

Ajouter dans `next.config.js` :

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Compression automatique des images
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  // Headers de sécurité
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',        value: 'DENY'            },
          { key: 'X-Content-Type-Options',  value: 'nosniff'         },
          { key: 'Referrer-Policy',         value: 'strict-origin'   },
        ],
      },
    ]
  },

  // Réduire la taille du bundle
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
}

module.exports = nextConfig
```

### Résoudre les erreurs de build courantes

**Erreur : `Module not found`**
```bash
# Vérifier que tous les fichiers importés existent bien
npm run build  # tester le build en local avant de pusher
```

**Erreur : `Type error` TypeScript**
```bash
npx tsc --noEmit  # vérifier les types sans compiler
```

**Erreur : `NEXT_PUBLIC_* not defined`**
```bash
# Ces variables doivent être présentes au BUILD TIME sur Vercel
# Vérifier qu'elles sont bien définies dans Vercel → Environment Variables
# Redéployer après les avoir ajoutées
```

**Erreur : routes API qui timeout (>10s)**

Les routes Vercel en plan gratuit ont un timeout de 10s (60s en Pro).
La route `/api/coach` avec Groq répond en < 1s — pas de problème.
Si vous utilisez Anthropic, ajouter un timeout explicite :

```typescript
// Dans route.ts
const controller = new AbortController()
const timeout = setTimeout(() => controller.abort(), 8000) // 8s max

try {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    signal: controller.signal,
    // ...
  })
  clearTimeout(timeout)
} catch (err) {
  clearTimeout(timeout)
  return NextResponse.json({ reply: getLocalFallback(messages) })
}
```

---

## 16. Checklist de mise en production finale

```
SUPABASE
□ Projet Supabase créé (région proche des utilisateurs)
□ schema.sql appliqué
□ Migrations 1 à 6 appliquées dans l'ordre
□ Trigger handle_new_user actif
□ RLS testé (un user B ne voit pas les données de A)
□ Site URL et Redirect URLs configurés avec le domaine Vercel

GROQ
□ Compte Groq créé, clé API générée
□ npm install groq-sdk exécuté
□ src/app/api/coach/route.ts mis à jour avec le client Groq
□ Test local : npm run dev → page Coach → envoyer un message
□ Réponse reçue en < 1s

VERCEL
□ .gitignore inclut .env.local et node_modules/
□ npm run build passe sans erreur en local
□ npx tsc --noEmit passe sans erreur TypeScript
□ Repo Git créé et code pushé
□ Projet importé sur Vercel
□ 5 variables d'environnement configurées dans Vercel
□ Premier déploiement réussi (status : Ready)
□ Domaine custom configuré (optionnel)
□ HTTPS actif (automatique sur Vercel)

TESTS POST-DÉPLOIEMENT
□ Inscription / connexion fonctionne
□ Création d'un domaine → visible dans Supabase Table Editor
□ Création d'une tâche → persistée après rechargement
□ Toggle d'une tâche → XP mis à jour
□ Lancement d'un challenge → tâches générées en base
□ Chat avec le coach IA → réponse Groq reçue
□ Test sur mobile (responsive)
□ Ouverture dans un autre navigateur → données synchronisées via Supabase
```

---

## Ressources

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth Helpers for Next.js](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Groq Console](https://console.groq.com)
- [Groq Node SDK](https://github.com/groq/groq-node)
- [Groq modèles disponibles](https://console.groq.com/docs/models)
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/app/building-your-application/deploying)
