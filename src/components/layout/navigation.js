import { ChartColumn, Flag, Layers, LayoutDashboard, ListChecks, ListPlus, Sparkles, Target, UserRound } from 'lucide-react'

// Source unique de la navigation : sidebar, barre mobile et feuille "Créer" la lisent.
export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Accueil', icon: LayoutDashboard },
  { to: '/tasks', label: 'Tâches', icon: ListChecks },
  { to: '/goals', label: 'Objectifs', icon: Target },
  { to: '/domains', label: 'Domaines', icon: Layers },
  { to: '/challenges', label: 'Challenges', icon: Flag },
  { to: '/monthly', label: 'Statistiques', icon: ChartColumn },
  { to: '/coach', label: 'Coach', icon: Sparkles },
  { to: '/profile', label: 'Profil', icon: UserRound },
]

// Barre du bas sur mobile : 2 entrées, bouton "+", 2 entrées. Le reste est dans la feuille du "+".
export const MOBILE_LEFT = ['/dashboard', '/tasks']
export const MOBILE_RIGHT = ['/challenges', '/profile']

export const CREATE_ACTIONS = [
  { to: '/tasks?new=1', label: 'Nouvelle tâche', hint: 'Une action à faire un jour précis', icon: ListPlus },
  { to: '/goals?new=1', label: 'Nouvel objectif', hint: 'Un but relié à vos tâches', icon: Target },
  { to: '/domains?new=1', label: 'Nouveau domaine', hint: 'Un grand pan de votre vie', icon: Layers },
]

export const findNav = (paths) => paths.map((p) => NAV_ITEMS.find((i) => i.to === p))
