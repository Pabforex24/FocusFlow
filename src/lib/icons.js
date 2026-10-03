import {
  BookOpen, Brain, Briefcase, Code, Crown, Dumbbell, Flag, Flame, GraduationCap, Heart, House, Gem, Leaf,
  Mountain, MoonStar, Music, Palette, Plane, Sprout, Star, Target, Timer, TrendingUp, Trophy, Wallet, Zap, CircleCheck,
} from 'lucide-react'

// Icônes disponibles pour les domaines et challenges. La base stocke la CLÉ (ex. "dumbbell").
export const ICONS = {
  target: Target, 'trending-up': TrendingUp, dumbbell: Dumbbell, 'book-open': BookOpen, briefcase: Briefcase,
  brain: Brain, palette: Palette, house: House, wallet: Wallet, leaf: Leaf, music: Music, plane: Plane,
  heart: Heart, 'graduation-cap': GraduationCap, code: Code, 'moon-star': MoonStar,
  // utilisées par les badges
  sprout: Sprout, 'circle-check': CircleCheck, trophy: Trophy, flame: Flame, zap: Zap, mountain: Mountain,
  star: Star, crown: Crown, gem: Gem, timer: Timer, flag: Flag,
}

// Sélecteur de domaine : les 16 premières clés.
export const DOMAIN_ICON_KEYS = Object.keys(ICONS).slice(0, 16)

// Anciennes données : les domaines créés avant la refonte stockent un emoji.
const LEGACY_EMOJI = {
  '🎯': 'target', '📈': 'trending-up', '🏋️': 'dumbbell', '📚': 'book-open', '💼': 'briefcase', '🧠': 'brain',
  '🎨': 'palette', '🏠': 'house', '💰': 'wallet', '🌿': 'leaf', '🎵': 'music', '✈️': 'plane',
}

export function resolveIcon(name, fallback = Target) {
  return ICONS[name] ?? ICONS[LEGACY_EMOJI[name]] ?? fallback
}

// Palette volontairement courte et cohérente avec la marque.
export const DOMAIN_COLORS = ['#7B61FF', '#0EA5A4', '#F59E0B', '#3B82F6', '#10B981', '#F43F5E', '#EC4899', '#64748B']

// Fond translucide d'une couleur hexadécimale (#RRGGBB) : tint('#7B61FF', 0.12)
export function tint(hex, alpha = 0.12) {
  const a = Math.round(alpha * 255).toString(16).padStart(2, '0')
  return `${hex}${a}`
}
