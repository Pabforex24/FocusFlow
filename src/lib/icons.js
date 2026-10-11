import {
  BookOpen, Brain, Briefcase, Code, Crown, Dumbbell, Flag, Flame, GraduationCap, Heart, House, Gem, Leaf,
  Mountain, MoonStar, Music, Palette, Plane, Sprout, Star, Target, Timer, TrendingUp, Trophy, Wallet, Zap, CircleCheck,
  Rocket, Sun, Globe, Languages, Lightbulb, PenTool, Camera, Gamepad2, Coffee, Bike, Footprints, PiggyBank, Compass, Shield,
} from 'lucide-react'

// Icônes disponibles pour les domaines et challenges. La base stocke la CLÉ (ex. "dumbbell").
export const ICONS = {
  target: Target, 'trending-up': TrendingUp, dumbbell: Dumbbell, 'book-open': BookOpen, briefcase: Briefcase,
  brain: Brain, palette: Palette, house: House, wallet: Wallet, leaf: Leaf, music: Music, plane: Plane,
  heart: Heart, 'graduation-cap': GraduationCap, code: Code, 'moon-star': MoonStar,
  rocket: Rocket, flame: Flame, crown: Crown, gem: Gem, star: Star, trophy: Trophy, zap: Zap, timer: Timer,
  mountain: Mountain, sprout: Sprout, sun: Sun, globe: Globe, languages: Languages, lightbulb: Lightbulb,
  'pen-tool': PenTool, camera: Camera, gamepad2: Gamepad2, coffee: Coffee, bike: Bike, footprints: Footprints,
  'piggy-bank': PiggyBank, compass: Compass, shield: Shield, 'circle-check': CircleCheck, flag: Flag,
}

// Clés proposées dans les sélecteurs (domaines et challenges).
export const DOMAIN_ICON_KEYS = Object.keys(ICONS)

// Anciennes données : les domaines créés avant la refonte stockent un emoji.
const LEGACY_EMOJI = {
  '🎯': 'target', '📈': 'trending-up', '🏋️': 'dumbbell', '📚': 'book-open', '💼': 'briefcase', '🧠': 'brain',
  '🎨': 'palette', '🏠': 'house', '💰': 'wallet', '🌿': 'leaf', '🎵': 'music', '✈️': 'plane',
}

export function resolveIcon(name, fallback = Target) {
  return ICONS[name] ?? ICONS[LEGACY_EMOJI[name]] ?? fallback
}

// Palette volontairement courte et cohérente avec la marque.
export const DOMAIN_COLORS = [
  '#4FB286', '#3B82F6', '#F59E0B', '#8B5CF6', '#F43F5E', '#EC4899', '#F97316', '#64748B',
  '#14B8A6', '#06B6D4', '#6366F1', '#A855F7', '#22C55E', '#EAB308', '#EF4444', '#0EA5E9',
]

// Fond translucide d'une couleur hexadécimale (#RRGGBB) : tint('#7B61FF', 0.12)
export function tint(hex, alpha = 0.12) {
  const a = Math.round(alpha * 255).toString(16).padStart(2, '0')
  return `${hex}${a}`
}
