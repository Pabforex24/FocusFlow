# FocusFlow (reconstruction)

PWA de discipline personnelle : **Domaines → Objectifs → Tâches**, challenges, mode Focus, XP / niveaux / badges / séries.
Stack : **React + JavaScript + Vite + Tailwind CSS 4 + Lucide + Supabase**. Aucune ligne de TypeScript (`npm run check:js-only` le vérifie).

## Démarrage

1. Créez un projet Supabase, puis exécutez `supabase/schema.sql` dans l'éditeur SQL.
2. Dans Supabase → Authentication → Providers, laissez « Email » activé (désactivez la confirmation d'email pour tester plus vite si vous le souhaitez).
3. `cp .env.example .env` et renseignez `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` (clé **anon** uniquement, jamais la clé `service_role`).
4. `npm install` puis `npm run dev`.

Commandes : `npm run build` · `npm run preview` (teste aussi la PWA) · `npm test` · `npm run check:js-only`.
Déploiement Vercel : variables d'environnement `VITE_*` + `vercel.json` (déjà fourni) pour le routage.

## Architecture

```
src/
  lib/        Logique pure, testée : dates, gamification (XP/série/badges), challenges, stats, icônes
  services/   api.js : seul fichier qui parle à Supabase (timeout 15 s, erreurs remontées)
  contexts/   Auth · Data (source de vérité + actions) · Focus (minuteur) · Toast
  components/ Layout, Modal, TaskItem, TaskForm, FocusBar, DomainTile
    layout/   Sidebar, Header, MobileNav, Logo, navigation (source unique des menus)
    ui/       Design system : Button, Card, Badge, ProgressBar/Ring, StatCard, Input/Field,
              Alert, Menu, Switch, Segmented, EmptyState, ErrorState, ConfirmDialog…
  pages/      Dashboard, Tasks, Goals, Domains, Challenges, Monthly (Statistiques), Coach, Profile, Login
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

## PWA

`public/manifest.webmanifest` + `public/sw.js` (volontairement minimal : fichiers de l'app en cache, navigation réseau d'abord, **Supabase jamais intercepté**). Le service worker n'est actif qu'en production (`npm run build`).

## Ce qui diffère de l'ancienne version

- **Coach IA (Groq)** : remplacé par un coach local (conseils calculés). La clé Groq ne doit pas être dans le navigateur ; une app Vite n'a pas de serveur. Pour le rétablir : une Supabase Edge Function (ou une fonction Vercel) en JavaScript qui appelle Groq, que la page Coach appellerait.
- **Notifications push / rappels** : non repris (complexité, fiabilité variable sur iOS). Peut être ajouté ensuite.
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
