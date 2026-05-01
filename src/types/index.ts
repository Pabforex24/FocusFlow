// ─── Core domain types ───────────────────────────────────────────────────────

export interface Domain {
  id: string
  userId?: string
  name: string
  icon: string
  color: string
  createdAt: string
}

export interface Goal {
  id: string
  domainId: string
  title: string
  description?: string
  deadline?: string       // null si challenge-objectif
  challengeId?: string    // défini si l'objectif est rattaché à un challenge
  createdAt: string
}

export type FrequencyType = 'daily' | 'weekend' | 'workdays' | 'custom'

export interface Task {
  id: string
  title: string
  domainId?: string
  goalId?: string
  challengeActiveId?: string
  duration?: string
  scheduledAt: string
  done: boolean
  doneAt?: string
  xpValue: number
  priority?: 'low' | 'medium' | 'high'
  frequency?: FrequencyType         // pour tâches récurrentes de challenge
  customDays?: number[]             // 0=dim,1=lun,...6=sam — si frequency==='custom'
  isGenerated?: boolean             // marqueur tâches auto-générées
  createdAt: string
}

// ─── Gamification ─────────────────────────────────────────────────────────────

export interface UserStats {
  xp: number
  level: number
  xpToNextLevel: number
  totalTasksDone: number
  challengesCompleted: number
  longestStreak: number
  hardcoreMode: boolean
}

export type BadgeId =
  | 'first_task'
  | 'streak_7'
  | 'streak_30'
  | 'tasks_10'
  | 'tasks_30'
  | 'tasks_100'
  | 'challenge_done'
  | 'challenge_3'
  | 'early_bird'
  | 'night_owl'
  | 'perfectionist'
  | 'comeback'
  | 'focus_5'
  | 'focus_master'

export interface Badge {
  id: BadgeId
  title: string
  description: string
  icon: string
  unlockedAt?: string
  xpReward: number
}

// ─── Focus Mode ───────────────────────────────────────────────────────────────

export type FocusStatus = 'idle' | 'running' | 'paused' | 'done' | 'abandoned'

export interface FocusSession {
  id: string
  taskId?: string
  durationMinutes: number
  elapsedSeconds: number
  status: FocusStatus
  startedAt?: string
  completedAt?: string
  xpEarned: number
}

// ─── Challenge types ──────────────────────────────────────────────────────────

/** Définition d'une tâche dans un challenge (blueprint) — fréquence incluse */
export interface ChallengeBlueprint {
  id: string
  title: string
  domainId: string
  duration: string
  frequency?: FrequencyType
  customDays?: number[]   // 0-6
}

export interface Challenge {
  id: string
  title: string
  description: string
  durationDays: number
  color: string
  icon: string
  blueprints: ChallengeBlueprint[]
  /** Date d'échéance explicite (overrides durationDays if set) */
  deadline?: string
}

export interface ActiveChallenge {
  id: string
  challengeId: string
  startDate: string
  endDate: string
  isActive: boolean
  currentDay: number
  createdAt: string
}

// ─── Onboarding ───────────────────────────────────────────────────────────────

export type OnboardingStep = 'domains' | 'goal' | 'tasks' | 'done'

export interface OnboardingState {
  completed: boolean
  step: OnboardingStep
}

// ─── Computed types ───────────────────────────────────────────────────────────

export interface GoalWithProgress extends Goal {
  progress: number
  domain?: Domain
  taskCount: number
  doneCount: number
  challengeTitle?: string
}

// ─── Store interface ──────────────────────────────────────────────────────────

export interface AppStore {
  // ── Data ──────────────────────────────────────────────────────────────────
  domains: Domain[]
  goals: Goal[]
  tasks: Task[]
  streak: number
  lastActive: string | null
  onboarding: OnboardingState

  // ── Gamification state ────────────────────────────────────────────────────
  userStats: UserStats
  badges: Badge[]
  focusSession: FocusSession | null

  // ── Challenges ────────────────────────────────────────────────────────────
  activeChallenges: ActiveChallenge[]
  customChallenges: Challenge[]

  // ── Domain actions ────────────────────────────────────────────────────────
  addDomain: (domain: Omit<Domain, 'id' | 'createdAt'>) => void
  updateDomain: (id: string, data: Partial<Domain>) => void
  deleteDomain: (id: string) => void

  // ── Goal actions ──────────────────────────────────────────────────────────
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => void
  updateGoal: (id: string, data: Partial<Goal>) => void
  deleteGoal: (id: string) => void

  // ── Task actions ──────────────────────────────────────────────────────────
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void
  bulkAddTasks: (tasks: Omit<Task, 'id' | 'createdAt'>[]) => void

  // ── Gamification actions ──────────────────────────────────────────────────
  awardXP: (amount: number, reason?: string) => void
  checkAndAwardBadges: () => void
  applyDailyPenalty: () => void
  toggleHardcoreMode: () => void

  // ── Focus Session actions ─────────────────────────────────────────────────
  startFocus: (taskId?: string, durationMinutes?: number) => void
  tickFocus: () => void
  pauseFocus: () => void
  resumeFocus: () => void
  completeFocus: () => void
  abandonFocus: () => void

  // ── Challenge actions ─────────────────────────────────────────────────────
  startChallenge: (challengeId: string, domainIdMap: Record<string, string>) => void
  stopChallenge: (activeChallengeId: string) => void
  generateAllChallengeTasks: (activeChallengeId: string) => void
  getChallengeProgress: (activeChallengeId: string, challengeId: string) => number
  getTodayChallengeTaskCount: (activeChallengeId: string) => { total: number; done: number }
  addCustomChallenge: (data: Omit<Challenge, 'id'>) => void
  updateCustomChallenge: (id: string, data: Partial<Omit<Challenge, 'id'>>) => void
  deleteCustomChallenge: (id: string) => void
  /** Deprecated alias kept for compat */
  generateTodayChallengeTasks: (activeChallengeId: string) => void

  // ── Selectors ────────────────────────────────────────────────────────────
  updateStreak: () => void
  getTasksForDate: (date: Date) => Task[]
  getDomainProgress: (domainId: string) => number
  getGoalProgress: (goalId: string) => number
  getGlobalProgress: () => number
  getTop3Tasks: () => Task[]

  // ── Onboarding ────────────────────────────────────────────────────────────
  completeOnboarding: () => void
  setOnboardingStep: (step: OnboardingStep) => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const DOMAIN_COLORS = [
  '#7B61FF', '#00C2A8', '#FF6B6B', '#FFB830',
  '#4EA8DE', '#A259FF', '#F24E1E', '#1BC47D',
  '#FF7262', '#0ACF83',
]

export const DOMAIN_ICONS = [
  'BookOpen', 'Briefcase', 'Dumbbell', 'TrendingUp',
  'Target', 'Palette', 'Code2', 'Leaf',
  'Music2', 'Plane', 'Brain', 'FlaskConical',
  'Trophy', 'Heart', 'Zap', 'Rocket',
  'Globe', 'Camera', 'Pen', 'ShoppingBag',
  'Car', 'Home', 'Coffee', 'Star',
  'Sun', 'Moon', 'Compass', 'Layers',
]

export const xpForLevel = (level: number) => level * 100 + 50

export const ALL_BADGES: Badge[] = [
  { id: 'first_task',    title: 'Premier pas',      description: 'Complète ta première tâche',            icon: '🌱', xpReward: 50  },
  { id: 'streak_7',      title: 'Semaine de feu',   description: '7 jours de streak consécutifs',         icon: '🔥', xpReward: 150 },
  { id: 'streak_30',     title: 'Invincible',        description: '30 jours de streak consécutifs',        icon: '⚡', xpReward: 500 },
  { id: 'tasks_10',      title: 'En marche',         description: '10 tâches complétées au total',         icon: '🚀', xpReward: 100 },
  { id: 'tasks_30',      title: 'Momentum',          description: '30 tâches complétées au total',         icon: '💪', xpReward: 200 },
  { id: 'tasks_100',     title: 'Centurion',         description: '100 tâches complétées au total',        icon: '🏆', xpReward: 500 },
  { id: 'challenge_done',title: 'Challenger',        description: 'Terminer ton premier challenge',        icon: '🎯', xpReward: 300 },
  { id: 'challenge_3',   title: 'Série de défis',    description: '3 challenges terminés',                 icon: '👑', xpReward: 600 },
  { id: 'early_bird',    title: 'Lève-tôt',          description: 'Compléter une tâche avant 8h',          icon: '🌅', xpReward: 75  },
  { id: 'night_owl',     title: 'Noctambule',        description: 'Compléter une tâche après 23h',         icon: '🌙', xpReward: 75  },
  { id: 'perfectionist', title: 'Perfectionniste',   description: "100% des tâches d'une journée",         icon: '✨', xpReward: 200 },
  { id: 'comeback',      title: 'Résilience',        description: 'Revenir après une pénalité',            icon: '💫', xpReward: 100 },
  { id: 'focus_5',       title: 'Focus Padawan',     description: '5 sessions Focus complétées',           icon: '🧘', xpReward: 150 },
  { id: 'focus_master',  title: 'Focus Master',      description: '25 sessions Focus complétées',          icon: '🎓', xpReward: 400 },
]

/** Retourne les dates entre start et end (inclus) qui correspondent à la fréquence */
export function getOccurrenceDates(
  start: Date,
  end: Date,
  frequency: FrequencyType,
  customDays?: number[]
): Date[] {
  const dates: Date[] = []
  const cur = new Date(start)
  cur.setHours(0, 0, 0, 0)
  const endNorm = new Date(end)
  endNorm.setHours(23, 59, 59, 999)

  while (cur <= endNorm) {
    const dow = cur.getDay() // 0=dim
    let include = false
    if (frequency === 'daily') {
      include = true
    } else if (frequency === 'workdays') {
      include = dow >= 1 && dow <= 5
    } else if (frequency === 'weekend') {
      include = dow === 0 || dow === 6
    } else if (frequency === 'custom') {
      include = (customDays || []).includes(dow)
    }
    if (include) dates.push(new Date(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}
