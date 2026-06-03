# FocusFlow — Guide de configuration complet
## Supabase · Variables d'environnement · Vercel · Déploiement

> **Ce guide part de zéro.** Suis chaque étape dans l'ordre exact.  
> Durée estimée : 20–30 minutes.

---

## Table des matières

1. [Prérequis](#1-prérequis)
2. [Créer le projet Supabase](#2-créer-le-projet-supabase)
3. [Configurer la base de données](#3-configurer-la-base-de-données)
4. [Configurer l'authentification Supabase](#4-configurer-lauthentification-supabase)
5. [Variables d'environnement — développement local](#5-variables-denvironnement--développement-local)
6. [Variables d'environnement — Vercel (production)](#6-variables-denvironnement--vercel-production)
7. [Déployer sur Vercel](#7-déployer-sur-vercel)
8. [Vérifications post-déploiement](#8-vérifications-post-déploiement)
9. [Problèmes fréquents et solutions](#9-problèmes-fréquents-et-solutions)
10. [Schéma complet de la base de données](#10-schéma-complet-de-la-base-de-données)

---

## 1. Prérequis

Avant de commencer, assure-toi d'avoir :

- Un compte **Supabase** → [supabase.com](https://supabase.com)
- Un compte **Vercel** → [vercel.com](https://vercel.com)
- Un compte **GitHub** avec le repo FocusFlow (public ou privé)
- Un compte **Groq** → [console.groq.com](https://console.groq.com) (pour le Coach IA)
- Node.js ≥ 18 installé localement

---

## 2. Créer le projet Supabase

### 2.1 Nouveau projet

1. Va sur [app.supabase.com](https://app.supabase.com)
2. Clique **New project**
3. Remplis :
   - **Name** : `focusflow` (ou ce que tu veux)
   - **Database Password** : génère un mot de passe fort et **sauvegarde-le**
   - **Region** : choisis la plus proche de tes utilisateurs (ex: `West EU (Ireland)`)
4. Clique **Create new project** — attends ~2 minutes

### 2.2 Récupérer les clés API

Une fois le projet créé :

1. Dans le menu gauche → **Settings** → **API**
2. Note ces 3 valeurs (tu en auras besoin aux étapes 5 et 6) :

```
Project URL          →  https://xxxxxxxxxxxx.supabase.co
anon public key      →  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  (longue chaîne)
service_role key     →  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  (NE PAS exposer côté client)
```

> ⚠️ **La `service_role` key ne doit JAMAIS être dans le code front-end ou commitée sur GitHub.**

---

## 3. Configurer la base de données

### 3.1 Exécuter le schéma SQL

1. Dans Supabase → menu gauche → **SQL Editor**
2. Clique **New query**
3. Copie-colle **l'intégralité** du schéma ci-dessous (section 10)
4. Clique **Run** (ou `Ctrl+Enter`)
5. Tu dois voir : `Success. No rows returned`

> ⚠️ **Si tu as déjà des tables** (ancien projet) : N'exécute PAS le schéma complet, il va tout recréer. Exécute uniquement le script de migration à la fin de ce guide.

### 3.2 Vérifier les tables créées

Dans Supabase → **Table Editor**, tu dois voir ces 6 tables :

| Table | Description |
|---|---|
| `profiles` | Profil utilisateur, XP, streak, badges |
| `domains` | Domaines de vie (Sport, Business, etc.) |
| `goals` | Objectifs liés aux domaines |
| `tasks` | Tâches quotidiennes |
| `active_challenges` | Challenges en cours |
| `custom_challenges` | Challenges personnalisés créés par l'utilisateur |

### 3.3 Vérifier les RLS (Row Level Security)

Dans **Table Editor** → clique sur chaque table → onglet **Policies**.  
Chaque table doit avoir une policy `FOR ALL USING (auth.uid() = user_id)` (ou `id` pour `profiles`).

Si une table n'a pas de policy → exécute le bloc RLS correspondant de la section 10.

### 3.4 Vérifier le trigger d'inscription

Dans Supabase → **Database** → **Functions** :  
Tu dois voir `handle_new_user` dans la liste.

Dans **Database** → **Triggers** :  
Tu dois voir `on_auth_user_created` sur la table `auth.users`.

Ce trigger crée automatiquement un profil dans `profiles` à chaque inscription.

---

## 4. Configurer l'authentification Supabase

### 4.1 Activer l'authentification par email

1. Supabase → **Authentication** → **Providers**
2. **Email** doit être activé (il l'est par défaut)
3. Options recommandées pour FocusFlow :
   - **Confirm email** : désactivé en développement, activé en production
   - **Secure email change** : activé

### 4.2 Configurer les URLs autorisées

1. Supabase → **Authentication** → **URL Configuration**
2. Remplis :

```
Site URL :
  https://ton-projet.vercel.app

Redirect URLs (une par ligne) :
  https://ton-projet.vercel.app/auth/callback
  http://localhost:3000/auth/callback
```

> ⚠️ **Sans ces URLs, la connexion retourne une erreur `redirect_uri_mismatch`.**

### 4.3 Durée de session

1. Supabase → **Authentication** → **Sessions**
2. Valeurs recommandées :
   - **JWT expiry** : `3600` (1 heure)
   - **Refresh token reuse interval** : `10`

---

## 5. Variables d'environnement — développement local

### 5.1 Créer le fichier `.env.local`

À la **racine du projet** (même niveau que `package.json`), crée un fichier `.env.local` :

```bash
# ── Supabase ──────────────────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ── Groq AI (Coach IA) ────────────────────────────────────────────────────────
# Obtenir sur : https://console.groq.com/keys
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> ⚠️ **Règles importantes :**
> - `.env.local` est dans `.gitignore` — il ne sera **jamais** committé sur GitHub
> - Les variables `NEXT_PUBLIC_*` sont visibles côté client (navigateur) — ne mets que l'URL et la clé anon
> - `GROQ_API_KEY` est côté serveur uniquement (route `/api/coach`) — ne la préfixe pas `NEXT_PUBLIC_`

### 5.2 Vérifier que `.gitignore` contient bien

```
.env.local
.env*.local
```

### 5.3 Lancer le projet en local

```bash
npm install
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000) — si tu vois la page de login, la configuration est correcte.

### 5.4 Tester la connexion Supabase

Dans la console du navigateur (F12), si tu vois :

```
✅  Pas d'erreur → Supabase est configuré
❌  isSupabaseConfigured = false → Vérifie les variables dans .env.local
```

---

## 6. Variables d'environnement — Vercel (production)

### 6.1 Ajouter les variables dans Vercel

1. Va sur [vercel.com](https://vercel.com) → ton projet FocusFlow
2. Onglet **Settings** → **Environment Variables**
3. Ajoute chaque variable une par une :

| Nom | Valeur | Environnement |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbG...` (clé anon) | Production, Preview, Development |
| `GROQ_API_KEY` | `gsk_xxx...` | Production, Preview, Development |

> ⚠️ **Cocher les 3 environnements** (Production + Preview + Development) sinon les builds de preview échoueront.

### 6.2 Important — après avoir ajouté les variables

Après ajout ou modification d'une variable Vercel, tu dois **redéployer** pour que les changements prennent effet :

1. Vercel → onglet **Deployments**
2. Sur le dernier déploiement → `...` → **Redeploy**

Ou via CLI :
```bash
vercel --prod
```

---

## 7. Déployer sur Vercel

### 7.1 Connecter le repo GitHub (première fois)

1. [vercel.com](https://vercel.com) → **New Project**
2. **Import Git Repository** → sélectionne ton repo FocusFlow
3. Configure :
   - **Framework Preset** : Next.js (auto-détecté)
   - **Root Directory** : `.` (racine)
   - **Build Command** : `npm run build` (par défaut)
   - **Output Directory** : `.next` (par défaut)
4. Ajoute les variables d'environnement (étape 6.1)
5. Clique **Deploy**

### 7.2 Déploiements suivants

Chaque `git push` sur `main` déclenche automatiquement un déploiement Vercel.

```bash
git add .
git commit -m "fix: sync mobile"
git push origin main
# → Vercel déploie automatiquement en ~2 minutes
```

### 7.3 Vérifier le build

Dans Vercel → **Deployments** → clique sur le dernier déploiement → **View Build Logs**.

Erreurs fréquentes et solutions :

```
Error: Type error: ... null is not assignable to string
→ Voir section 9.1

Error: Cannot find module '@/...'
→ Vérifier les alias dans tsconfig.json

Error: Missing environment variable
→ Ajouter la variable dans Vercel Settings → Environment Variables
```

---

## 8. Vérifications post-déploiement

Après chaque déploiement, vérifie ces points dans l'ordre :

### 8.1 Checklist fonctionnelle

```
□  Page login accessible → https://ton-projet.vercel.app/auth/login
□  Inscription fonctionne → un profil apparaît dans Supabase → Table Editor → profiles
□  Connexion fonctionne → redirige vers /dashboard
□  Le nom s'affiche (pas "Mode offline") dans la Sidebar
□  Création d'une tâche → apparaît dans Supabase → Table Editor → tasks
□  Complétion d'une tâche → colonne done = true dans Supabase
□  Déconnexion → redirige vers /auth/login
□  Reconnexion → les données persistent (sync depuis Supabase)
□  Coach IA répond → /coach (nécessite GROQ_API_KEY)
```

### 8.2 Vérifier la sync cross-device

1. Connecte-toi avec le **même compte** sur desktop et mobile
2. Crée une tâche sur desktop
3. Sur mobile : attends 2-3 secondes ou navigue vers une autre page
4. La tâche doit apparaître sur mobile

Si elle n'apparaît pas :
- Vérifie que les variables Supabase sont identiques sur les deux appareils
- Ouvre F12 → Console → cherche les erreurs Supabase

---

## 9. Problèmes fréquents et solutions

### 9.1 Build Vercel échoue — TypeError TypeScript

```
Type error: Argument of type 'null' is not assignable to parameter of type 'string'
```

**Cause** : `setLastSyncedAt(null)` mais le type attend `string`.  
**Fix** : Utilise `setLastSyncedAt('')` à la place de `null`.

---

### 9.2 "Mode offline" affiché dans la Sidebar après connexion

**Causes possibles :**
1. Variables `NEXT_PUBLIC_SUPABASE_*` absentes → vérifier `.env.local` en local ou Vercel Settings en prod
2. `bootSync` trop lent → le store affiche `null` pendant ~300ms (normal, disparaît ensuite)
3. `localStorage` corrompu → ouvrir DevTools → Application → Local Storage → supprimer `focusflow-store-v10`

---

### 9.3 Connexion fonctionne sur mobile mais pas sur desktop (ou vice-versa)

**Cause** : Race condition entre `bootSync` et `onAuthStateChange SIGNED_IN`.  
**Fix** : S'assurer que `useSupabaseSync.ts` contient `bootDoneRef` pour éviter le double sync.

---

### 9.4 Les données créées sur desktop n'apparaissent pas sur mobile

**Causes possibles (dans l'ordre à vérifier) :**

1. **Pas le même compte** → vérifie l'email affiché sur chaque appareil
2. **Mode offline sur desktop** → vérifie que `.env.local` contient les bonnes variables
3. **Actions sans sync Supabase** → les actions `addTask`, `startChallenge` etc. doivent appeler `db.*` après le `set()`
4. **Delta sync bloqué** → `lastSyncedAt` trop récent → vide le localStorage et reconnecte-toi

---

### 9.5 Erreur `redirect_uri_mismatch` à la connexion

**Fix** : Ajouter l'URL dans Supabase → Authentication → URL Configuration → Redirect URLs.

---

### 9.6 Le profil n'est pas créé à l'inscription

**Fix** : Vérifier que le trigger `on_auth_user_created` existe dans Supabase → Database → Triggers.  
Si absent, exécuter dans SQL Editor :

```sql
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    NEW.id,
    NEW.email,
    coalesce(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1))
  )
  on conflict (id) do nothing;
  return NEW;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

---

### 9.7 Le Coach IA ne répond pas

**Causes possibles :**
1. `GROQ_API_KEY` absente ou invalide → vérifier Vercel Settings
2. Rate limit atteint (20 req/min/IP) → attendre 1 minute
3. Modèle indisponible → vérifier [status.groq.com](https://status.groq.com)

---

### 9.8 Navigation mobile PWA cassée (aucun clic ne fonctionne)

**Cause** : IIFE dans `store/index.ts` — actions qui s'exécutent au boot du store.  
**Fix** : Vérifier que `updateCustomChallenge` et `deleteCustomChallenge` sont des fonctions normales `() => {}` et non des IIFE `(() => {})()`.

---

### 9.9 Déconnexion ne fonctionne pas sur mobile

**Fix** : Dans `Sidebar.tsx`, le bouton déconnexion mobile doit avoir `onPointerUp` en plus de `onClick`, et `touchAction: 'manipulation'` dans le style.

---

## 10. Schéma complet de la base de données

> Exécute ce SQL dans **Supabase → SQL Editor → New query** pour un projet **vide**.  
> Pour un projet existant avec des données, utilise le script de migration en bas.

```sql
-- ═══════════════════════════════════════════════════════════════════════════
-- FocusFlow — Schéma PostgreSQL FINAL v3
-- Pour projet VIDE uniquement
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";

-- ── profiles ─────────────────────────────────────────────────────────────────
create table public.profiles (
  id                      uuid        references auth.users(id) on delete cascade primary key,
  email                   text,
  display_name            text,
  streak_count            integer     not null default 0,
  last_active             text,
  xp                      integer     not null default 0,
  level                   integer     not null default 1,
  badges                  jsonb       not null default '[]',
  total_tasks_done        integer     not null default 0,
  challenges_done         integer     not null default 0,
  longest_streak          integer     not null default 0,
  hardcore_mode           boolean     not null default false,
  deleted_catalogue_ids   jsonb       not null default '[]',
  catalogue_overrides     jsonb       not null default '{}',
  rest_days               jsonb       not null default '[]',
  rest_day_used_this_week boolean     not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "Users manage own profile"
  on public.profiles for all using (auth.uid() = id);

-- ── domains ──────────────────────────────────────────────────────────────────
create table public.domains (
  id         uuid        default uuid_generate_v4() primary key,
  user_id    uuid        references public.profiles(id) on delete cascade not null,
  name       text        not null,
  icon       text        not null default 'Target',
  color      text        not null default '#7B61FF',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.domains enable row level security;
create policy "Users manage own domains"
  on public.domains for all using (auth.uid() = user_id);
create index domains_user_id_idx    on public.domains(user_id);
create index domains_updated_at_idx on public.domains(updated_at);

-- ── goals ────────────────────────────────────────────────────────────────────
create table public.goals (
  id           uuid        default uuid_generate_v4() primary key,
  domain_id    uuid        references public.domains(id) on delete cascade not null,
  user_id      uuid        references public.profiles(id) on delete cascade not null,
  title        text        not null,
  description  text,
  unit         text,
  challenge_id text,
  deadline     date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.goals enable row level security;
create policy "Users manage own goals"
  on public.goals for all using (auth.uid() = user_id);
create index goals_user_id_idx      on public.goals(user_id);
create index goals_domain_id_idx    on public.goals(domain_id);
create index goals_updated_at_idx   on public.goals(updated_at);

-- ── active_challenges ────────────────────────────────────────────────────────
create table public.active_challenges (
  id           uuid        default uuid_generate_v4() primary key,
  user_id      uuid        references public.profiles(id) on delete cascade not null,
  challenge_id text        not null,
  start_date   date        not null,
  end_date     date        not null,
  is_active    boolean     not null default true,
  current_day  integer     not null default 1,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.active_challenges enable row level security;
create policy "Users manage own active challenges"
  on public.active_challenges for all using (auth.uid() = user_id);
create index active_challenges_user_id_idx    on public.active_challenges(user_id);
create index active_challenges_updated_at_idx on public.active_challenges(updated_at);

-- ── tasks ────────────────────────────────────────────────────────────────────
create table public.tasks (
  id                  uuid        default uuid_generate_v4() primary key,
  user_id             uuid        references public.profiles(id) on delete cascade not null,
  domain_id           uuid        references public.domains(id) on delete set null,
  goal_id             uuid        references public.goals(id) on delete set null,
  challenge_active_id text,
  title               text        not null,
  duration            text,
  scheduled_at        timestamptz not null default now(),
  done                boolean     not null default false,
  done_at             timestamptz,
  xp_value            integer     not null default 10,
  priority            text        check (priority in ('low','medium','high')) default 'medium',
  frequency           text        check (frequency in ('daily','workdays','weekend','custom')),
  custom_days         jsonb       not null default '[]',
  is_generated        boolean     not null default false,
  postponed           boolean     not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
alter table public.tasks enable row level security;
create policy "Users manage own tasks"
  on public.tasks for all using (auth.uid() = user_id);
create index tasks_user_id_idx          on public.tasks(user_id);
create index tasks_scheduled_at_idx     on public.tasks(scheduled_at);
create index tasks_done_idx             on public.tasks(done);
create index tasks_updated_at_idx       on public.tasks(updated_at);

-- ── custom_challenges ────────────────────────────────────────────────────────
create table public.custom_challenges (
  id            uuid        default uuid_generate_v4() primary key,
  user_id       uuid        references public.profiles(id) on delete cascade not null,
  title         text        not null,
  description   text        not null default '',
  duration_days integer     not null default 30,
  deadline      date,
  color         text        not null default '#7B61FF',
  icon          text        not null default 'Trophy',
  blueprints    jsonb       not null default '[]',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table public.custom_challenges enable row level security;
create policy "Users manage own custom challenges"
  on public.custom_challenges for all using (auth.uid() = user_id);
create index custom_challenges_user_id_idx    on public.custom_challenges(user_id);
create index custom_challenges_updated_at_idx on public.custom_challenges(updated_at);

-- ── Triggers updated_at ───────────────────────────────────────────────────────
create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin NEW.updated_at = now(); return NEW; end; $$;

create trigger profiles_updated_at   before update on public.profiles          for each row execute procedure public.update_updated_at();
create trigger domains_updated_at    before update on public.domains            for each row execute procedure public.update_updated_at();
create trigger goals_updated_at      before update on public.goals              for each row execute procedure public.update_updated_at();
create trigger tasks_updated_at      before update on public.tasks              for each row execute procedure public.update_updated_at();
create trigger ac_updated_at         before update on public.active_challenges  for each row execute procedure public.update_updated_at();
create trigger cc_updated_at         before update on public.custom_challenges  for each row execute procedure public.update_updated_at();

-- ── Trigger auto-création profil à l'inscription ──────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    NEW.id,
    NEW.email,
    coalesce(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1))
  )
  on conflict (id) do nothing;
  return NEW;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

---

## Script de migration — projet existant avec données

> Utilise ce script **uniquement** si tu as déjà des tables et des données à conserver.  
> Idempotent — peut être relancé sans risque.

```sql
-- ═══════════════════════════════════════════════════════════════════════════
-- FocusFlow — Migration projet existant
-- Idempotent — sans risque de relancer
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Colonnes manquantes dans profiles
alter table public.profiles
  add column if not exists display_name            text,
  add column if not exists deleted_catalogue_ids   jsonb not null default '[]',
  add column if not exists catalogue_overrides     jsonb not null default '{}',
  add column if not exists rest_days               jsonb not null default '[]',
  add column if not exists rest_day_used_this_week boolean not null default false,
  add column if not exists updated_at              timestamptz default now();

-- 2. challenge_active_id en TEXT (les IDs custom sont des strings)
alter table public.tasks drop column if exists challenge_active_id;
alter table public.tasks add  column challenge_active_id text;
alter table public.tasks
  add column if not exists postponed boolean not null default false;

-- 3. updated_at sur toutes les tables
alter table public.domains           add column if not exists updated_at timestamptz default now();
alter table public.goals             add column if not exists updated_at timestamptz default now();
alter table public.tasks             add column if not exists updated_at timestamptz default now();
alter table public.active_challenges add column if not exists updated_at timestamptz default now();
alter table public.custom_challenges add column if not exists updated_at timestamptz default now();

-- 4. Index delta sync
create index if not exists domains_updated_at_idx           on public.domains(updated_at);
create index if not exists goals_updated_at_idx             on public.goals(updated_at);
create index if not exists tasks_updated_at_idx             on public.tasks(updated_at);
create index if not exists active_challenges_updated_at_idx on public.active_challenges(updated_at);
create index if not exists custom_challenges_updated_at_idx on public.custom_challenges(updated_at);

-- 5. Triggers updated_at
create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin NEW.updated_at = now(); return NEW; end; $$;

drop trigger if exists profiles_updated_at   on public.profiles;
drop trigger if exists domains_updated_at    on public.domains;
drop trigger if exists goals_updated_at      on public.goals;
drop trigger if exists tasks_updated_at      on public.tasks;
drop trigger if exists ac_updated_at         on public.active_challenges;
drop trigger if exists cc_updated_at         on public.custom_challenges;

create trigger profiles_updated_at   before update on public.profiles          for each row execute procedure public.update_updated_at();
create trigger domains_updated_at    before update on public.domains            for each row execute procedure public.update_updated_at();
create trigger goals_updated_at      before update on public.goals              for each row execute procedure public.update_updated_at();
create trigger tasks_updated_at      before update on public.tasks              for each row execute procedure public.update_updated_at();
create trigger ac_updated_at         before update on public.active_challenges  for each row execute procedure public.update_updated_at();
create trigger cc_updated_at         before update on public.custom_challenges  for each row execute procedure public.update_updated_at();

-- 6. Trigger auto-création profil
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    NEW.id,
    NEW.email,
    coalesce(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1))
  )
  on conflict (id) do nothing;
  return NEW;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 7. RLS policies
alter table public.profiles          enable row level security;
alter table public.domains           enable row level security;
alter table public.goals             enable row level security;
alter table public.tasks             enable row level security;
alter table public.active_challenges enable row level security;
alter table public.custom_challenges enable row level security;

drop policy if exists "Users manage own profile"            on public.profiles;
drop policy if exists "Users manage own domains"            on public.domains;
drop policy if exists "Users manage own goals"              on public.goals;
drop policy if exists "Users manage own tasks"              on public.tasks;
drop policy if exists "Users manage own active challenges"  on public.active_challenges;
drop policy if exists "Users manage own custom challenges"  on public.custom_challenges;

create policy "Users manage own profile"           on public.profiles          for all using (auth.uid() = id);
create policy "Users manage own domains"           on public.domains           for all using (auth.uid() = user_id);
create policy "Users manage own goals"             on public.goals             for all using (auth.uid() = user_id);
create policy "Users manage own tasks"             on public.tasks             for all using (auth.uid() = user_id);
create policy "Users manage own active challenges" on public.active_challenges for all using (auth.uid() = user_id);
create policy "Users manage own custom challenges" on public.custom_challenges for all using (auth.uid() = user_id);

-- 8. Vérification finale
select table_name, count(*) as colonnes
from information_schema.columns
where table_schema = 'public'
group by table_name
order by table_name;
```

---

## Résumé des fichiers à configurer

```
FocusFlow/
├── .env.local                    ← Créer ce fichier (jamais committé)
│   ├── NEXT_PUBLIC_SUPABASE_URL
│   ├── NEXT_PUBLIC_SUPABASE_ANON_KEY
│   └── GROQ_API_KEY
│
├── src/lib/supabase.ts           ← Lit les variables d'environnement
├── src/lib/db.ts                 ← Toutes les fonctions Supabase
├── src/hooks/useSupabaseSync.ts  ← Sync automatique au login/logout
├── src/middleware.ts             ← Protection des routes (cookie Supabase)
└── src/store/index.ts            ← Store Zustand + actions avec sync Supabase
```

---

*FocusFlow v3.0 — README configuration · Mai 2026*
