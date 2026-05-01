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
  deadline?: string
  createdAt: string
}

export interface Task {
  id: string
  title: string
  domainId?: string
  goalId?: string
  challengeActiveId?: string   // ← relation propre (remplace goalId="challenge:")
  duration?: string
  scheduledAt: string
  done: boolean
  doneAt?: string
  xpValue: number              // XP gagné à la complétion
  priority?: 'low' | 'medium' | 'high'
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
  | 'perfectionist'    // 100% d'une journée
  | 'comeback'         // revient après pénalité
  | 'focus_5'          // 5 sessions Focus complétées
  | 'focus_master'     // 25 sessions Focus complétées

export interface Badge {
  id: BadgeId
  title: string
  description: string
  icon: string         // emoji
  unlockedAt?: string  // ISO — absent si pas encore débloqué
  xpReward: number
}

// ─── Focus Mode ───────────────────────────────────────────────────────────────

export type FocusStatus = 'idle' | 'running' | 'paused' | 'done' | 'abandoned'

export interface FocusSession {
  id: string
  taskId?: string
  durationMinutes: number   // durée cible (25 par défaut)
  elapsedSeconds: number    // suivi réel
  status: FocusStatus
  startedAt?: string
  completedAt?: string
  xpEarned: number
}

// ─── Challenge types ──────────────────────────────────────────────────────────

export interface ChallengeBlueprint {
  id: string
  title: string
  domainId: string
  duration: string
  description?: string
}

export interface Challenge {
  id: string
  title: string
  description: string
  durationDays: number
  color: string
  icon: string
  blueprints: ChallengeBlueprint[]
}

export interface ActiveChallenge {
  id: string
  challengeId: string
  startDate: string
  endDate: string
  isActive: boolean
  currentDay: number        // jour courant généré (lazy generation)
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
  generateTodayChallengeTasks: (activeChallengeId: string) => void
  getChallengeProgress: (activeChallengeId: string, challengeId: string) => number
  getTodayChallengeTaskCount: (activeChallengeId: string) => { total: number; done: number }
  addCustomChallenge: (data: Omit<Challenge, 'id'>) => void
  updateCustomChallenge: (id: string, data: Partial<Omit<Challenge, 'id'>>) => void
  deleteCustomChallenge: (id: string) => void

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

// XP par niveau (niveau n nécessite n * 100 + 50 XP)
export const xpForLevel = (level: number) => level * 100 + 50

// All badge definitions
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
  { id: 'perfectionist', title: 'Perfectionniste',   description: '100% des tâches d\'une journée',        icon: '✨', xpReward: 200 },
  { id: 'comeback',      title: 'Résilience',        description: 'Revenir après une pénalité',            icon: '💫', xpReward: 100 },
  { id: 'focus_5',       title: 'Focus Padawan',     description: '5 sessions Focus complétées',           icon: '🧘', xpReward: 150 },
  { id: 'focus_master',  title: 'Focus Master',      description: '25 sessions Focus complétées',          icon: '🎓', xpReward: 400 },
]
