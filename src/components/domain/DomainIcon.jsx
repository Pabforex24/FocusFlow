import {
  BookOpen, Briefcase, Dumbbell, TrendingUp, Target,
  Palette, Code2, Leaf, Music2, Plane, Brain, FlaskConical,
  Trophy, Heart, Zap, Rocket, Globe, Camera, Pen, ShoppingBag,
  Car, Home, Coffee, Star, Sun, Moon, Compass, Layers,
} from 'lucide-react'
import { LucideIcon } from 'lucide-react'

// ─── Registry ────────────────────────────────────────────────────────────────
export const ICON_MAP = {
  BookOpen,
  Briefcase,
  Dumbbell,
  TrendingUp,
  Target,
  Palette,
  Code2,
  Leaf,
  Music2,
  Plane,
  Brain,
  FlaskConical,
  Trophy,
  Heart,
  Zap,
  Rocket,
  Globe,
  Camera,
  Pen,
  ShoppingBag,
  Car,
  Home,
  Coffee,
  Star,
  Sun,
  Moon,
  Compass,
  Layers,
}

// Keys used in types/index.ts DOMAIN_ICONS
export const DOMAIN_ICON_KEYS = Object.keys(ICON_MAP)

// ─── Component ────────────────────────────────────────────────────────────────


export function DomainIcon({ name, size = 18, className, color }) {
  const Icon = ICON_MAP[name] ?? Target
  return <Icon size={size} className={className} color={color} />
}
