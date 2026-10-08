# FocusFlow (reconstruction)

PWA de discipline personnelle : **Domaines → Objectifs → Tâches**, challenges, mode Focus, XP / niveaux / badges / séries.
Stack : **React + JavaScript + Vite + Tailwind CSS 4 + Lucide + Supabase**. Aucune ligne de TypeScript (`npm run check:js-only` le vérifie).

## Démarrage

1. Créez un projet Supabase, puis exécutez `supabase/schema.sql` dans l'éditeur SQL.
2. Dans Supabase → Authentication → Providers, laissez « Email » activé (désactivez la confirmation d'email pour tester plus vite si vous le souhaitez).
3. `cp .env.example .env` et renseignez `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` (clé **anon** uniquement, jamais la clé `service_role`).
4. `npm install` puis `npm run dev`.

Commandes : `npm run build` · `npm run preview` (teste aussi la PWA) · `npm test` · `npm run check:js-only` · `npm run check` (tout).
Déploiement Vercel : `vercel.json` (déjà fourni) gère le routage ; les fonctions `api/` attendent des variables serveur (voir « Coach IA » et « Notifications »).

## Architecture

```
src/
  lib/        Logique pure, testée : dates, gamification (XP/série/badges), challenges, stats, icônes, coach (contexte), notifications, push
  services/   api.js : seul fichier qui parle à Supabase (timeout 15 s, erreurs remontées) · coachApi.js
  hooks/      useOpenOnNew · usePushNotifications (abonnement push)
  contexts/   Auth · Data (source de vérité + actions) · Focus (minuteur) · Toast
  components/ Layout, Modal, TaskItem, TaskForm, FocusBar, DomainTile
    layout/   Sidebar, Header, MobileNav, Logo, navigation (source unique des menus)
    ui/       Design system : Button, Card, Badge, ProgressBar/Ring, StatCard, Input/Field,
              Alert, Menu, Switch, Segmented, EmptyState, ErrorState, ConfirmDialog…
  pages/      Dashboard, Tasks, Goals, Domains, Challenges, Monthly (Statistiques), Coach, Profile, Login
api/          Fonctions Vercel (serveur) : coach.js (Groq), notify.js (rappels push planifiés)
```

### Règles de conception (pourquoi c'est plus stable)

- **Supabase est la source de vérité.** Pas de store persisté en localStorage, pas de delta sync : une modification est envoyée au serveur, puis l'écran est mis à jour avec la ligne renvoyée. Les suppressions se propagent, car l'app recharge tout au retour sur l'écran (si > 30 s), au retour du réseau et à la connexion.
- **XP, niveau, série, badges sont calculés**, jamais stockés : impossible d'avoir des compteurs désynchronisés entre appareils.
- **Dates = jours locaux `YYYY-MM-DD`** (colonne SQL `date`), plus de décalage UTC.
- **Plus de données « seed »** : un compte neuf est vide. Les challenges demandent un domaine au démarrage.
- **Erreurs** : chaque action affiche un message compréhensible (`lib/errors.js`) ; un `ErrorBoundary` évite l'écran blanc.
- **Sécurité** : RLS sur toutes les tables, clé anon seulement dans le navigateur.

### Règles métier conservées

| Élément | Règle |
|---|---|
| XP | tâche `xp_value` (10, ou 20 si générée par challenge) · session Focus +30 · journée 100 % +50 |
| Pénalité | jour passé avec tâches mais aucune faite : −15 XP (−30 en Hardcore), sauf jour d'imprévu ; XP jamais < 0 |
| Niveau | passer du niveau n au suivant coûte n×100+50 XP |
| Série | jours consécutifs avec ≥ 1 tâche faite ; aujourd'hui non fait ne casse pas la série ; un imprévu la protège |
| Imprévu | 1 par semaine (lundi → dimanche) |
| Focus | 15/25/45/60 min, basé sur l'heure réelle (survit à la veille), +30 XP, coche la tâche liée |

## Coach IA (Groq)

La page Coach affiche d'abord des conseils **locaux** (calculés dans le navigateur, disponibles hors-ligne). Le bouton « Analyser » envoie un résumé compact des données (sans email ni donnée personnelle) à `api/coach.js`, qui interroge Groq : **la clé API reste côté serveur**. Le conseil du jour est mis en cache localement.

Variables Vercel : `GROQ_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` (+ option `GROQ_MODEL`, défaut `llama-3.3-70b-versatile`).

## Notifications push

Rappel quotidien à l'heure choisie (dans le fuseau de l'utilisateur) et alerte de série le soir. Activation dans **Profil → Notifications**. Supabase `pg_cron` appelle toutes les 10 minutes `api/notify.js` (via `pg_net`) ; la table `push_log` garantit un seul envoi par rappel et par jour.

- Variables Vercel : `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_VAPID_PUBLIC_KEY` (au build), `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `CRON_SECRET`.
- Base : exécuter `supabase/migrations/003_notifications.sql`, puis `supabase/setup_cron_notify.sql` (recopier le secret affiché dans `CRON_SECRET`).
- Clés VAPID : `npx web-push generate-vapid-keys` (sujet = `mailto:…` ou URL du site).
- Limites : sur iOS, seules les PWA installées reçoivent des notifications (Partager → écran d'accueil, iOS ≥ 16.4) ; le service worker n'étant actif qu'en production, l'activation ne fonctionne pas en `npm run dev`.

## PWA

`public/manifest.webmanifest` + `public/sw.js` (fichiers de l'app en cache, navigation réseau d'abord, **Supabase jamais intercepté**, et gestion des notifications `push` / `notificationclick`). Le service worker n'est actif qu'en production (`npm run build`).

## Ce qui diffère de l'ancienne version

- **Coach IA (Groq)** : rétabli via une fonction serveur (`api/coach.js`) — bouton « Analyser » de la page Coach.
- **Notifications push / rappels** : rétablies (`api/notify.js` + `pg_cron` Supabase) — activées dans Profil.
- **Mode 100 % hors-ligne sans compte** : supprimé (deux sources de vérité = source de bugs). Un compte est requis.
- **Dates/heures des tâches** : jour uniquement (plus d'heure précise).
- À migrer si vous avez des données dans l'ancienne base : le schéma a changé (voir `supabase/schema.sql`), une migration manuelle est nécessaire.

## Design system

- **Tailwind CSS 4** via `@tailwindcss/vite` (aucun fichier `tailwind.config.js`) : couleurs, ombres et animations sont déclarées dans `src/styles/index.css`.
- **Thème clair / sombre** : variables sémantiques (`bg-bg`, `bg-surface`, `text-fg`, `text-muted`, `border-line`…) qui changent selon la classe `dark` sur `<html>`. Choix mémorisé (Profil → Apparence), appliqué avant le premier rendu.
- **Couleurs** : marque violette `brand-*` ; succès `emerald`, erreur `rose`, avertissement `amber`, info `sky`. Les domaines utilisent une palette de 8 couleurs (`lib/icons.js`).
- **Formes** : `rounded-xl` (boutons, champs), `rounded-2xl` (cartes), `rounded-3xl` (modales). Deux ombres seulement : `shadow-card`, `shadow-pop`.
- **Icônes** : uniquement Lucide, trait 1,75 réglé une fois dans `main.jsx`. Les domaines stockent la clé de l'icône (ex. `dumbbell`) ; les anciens emojis sont convertis à l'affichage.
- **Mobile d'abord** : barre du bas + feuille « + » sous 768 px, rail d'icônes jusqu'à 1024 px, sidebar complète au-delà. Champs en 16 px sur mobile (pas de zoom iOS), cibles tactiles de 44 px.
- Les formulaires utilisent `<Button type="submit">` (le type par défaut du composant est `button`).
