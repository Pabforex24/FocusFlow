import { ChartColumn, Flag, Layers, LayoutDashboard, ListChecks, ListPlus, Sparkles, Target } from 'lucide-react'

// Source unique de la navigation : barre haute, rail, barre mobile et feuille "Créer" la lisent.
// Le profil n'est volontairement plus ici : il passe par le menu de l'avatar.
export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Accueil', icon: LayoutDashboard },
  { to: '/tasks', label: 'Tâches', icon: ListChecks },
  { to: '/goals', label: 'Objectifs', icon: Target },
  { to: '/domains', label: 'Domaines', icon: Layers },
  { to: '/challenges', label: 'Challenges', short: 'Défis', icon: Flag },
  { to: '/monthly', label: 'Statistiques', short: 'Stats', icon: ChartColumn },
  { to: '/coach', label: 'Coach', icon: Sparkles },
]

// Desktop : les pages du quotidien restent dans la barre haute, l'analyse et l'accompagnement dans le rail.
export const DESKTOP_TOP = ['/dashboard', '/tasks', '/goals', '/domains']
export const DESKTOP_RAIL = ['/challenges', '/monthly', '/coach']

// Barre du bas sur mobile : 3 entrées, bouton "+", 3 entrées. Domaines reste dans la feuille du "+" ;
// le profil reste accessible par l'avatar en haut à droite. `short` = libellé court pour les petits écrans.
export const MOBILE_LEFT = ['/dashboard', '/tasks', '/goals']
export const MOBILE_RIGHT = ['/challenges', '/monthly', '/coach']

export const CREATE_ACTIONS = [
  { to: '/tasks?new=1', label: 'Nouvelle tâche', hint: 'Une action à faire un jour précis', icon: ListPlus },
  { to: '/goals?new=1', label: 'Nouvel objectif', hint: 'Un but relié à vos tâches', icon: Target },
  { to: '/domains?new=1', label: 'Nouveau domaine', hint: 'Un grand pan de votre vie', icon: Layers },
]

export const findNav = (paths) => paths.map((p) => NAV_ITEMS.find((i) => i.to === p))
