/**
 * db.ts — Couche d'accès Supabase pour FocusFlow.
 * Toutes les fonctions retournent des données en camelCase.
 * Elles sont appelées depuis useSupabaseSync et les actions du store.
 */

import { supabase, toCamel, toSnake } from './supabase'
import type {
  Domain, Goal, Task, Challenge, ActiveChallenge, UserStats, Badge,
} from '@/types'

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function getSession() {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function getUserId(): Promise<string | null> {
  const session = await getSession()
  return session?.user?.id ?? null
}

export async function signInWithEmail(email: string, password: string) {
  if (!supabase) throw new Error('Supabase non configuré')
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signUpWithEmail(email: string, password: string, displayName?: string) {
  if (!supabase) throw new Error('Supabase non configuré')
  return supabase.auth.signUp({
    email, password,
    options: { data: { display_name: displayName || email.split('@')[0] } },
  })
}

export async function signOut() {
  if (!supabase) return
  await supabase.auth.signOut()
}

// ─── Profile / UserStats ──────────────────────────────────────────────────────

export async function loadProfile(userId: string) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error || !data) return null
  return data
}

export async function upsertProfile(userId: string, stats: UserStats, extra: {
  streak: number
  lastActive: string | null
  badges: Badge[]
  catalogueOverrides: Record<string, any>
  deletedCatalogueIds: string[]
  onboardingCompleted: boolean
}) {
  if (!supabase) return
  await supabase.from('profiles').upsert({
    id:                     userId,
    xp:                     stats.xp,
    level:                  stats.level,
    streak_count:           extra.streak,
    last_active:            extra.lastActive,
    longest_streak:         stats.longestStreak,
    total_tasks_done:       stats.totalTasksDone,
    challenges_done:        stats.challengesCompleted,
    hardcore_mode:          stats.hardcoreMode,
    badges:                 extra.badges,
    catalogue_overrides:    extra.catalogueOverrides,
    deleted_catalogue_ids:  extra.deletedCatalogueIds,
  }, { onConflict: 'id' })
}

// ─── Domains ──────────────────────────────────────────────────────────────────

export async function loadDomains(userId: string): Promise<Domain[]> {
  if (!supabase) return []
  const { data } = await supabase
    .from('domains')
    .select('*')
    .eq('user_id', userId)
    .order('created_at')
  return (data || []).map((row) => ({
    id:        row.id,
    userId:    row.user_id,
    name:      row.name,
    icon:      row.icon,
    color:     row.color,
    createdAt: row.created_at,
  }))
}

export async function insertDomain(userId: string, domain: Domain) {
  if (!supabase) return null
  console.log('[db] insertDomain start — id:', domain.id, 'userId:', userId)
  const { error } = await supabase.from('domains').insert({
    id: domain.id, user_id: userId,
    name: domain.name, icon: domain.icon, color: domain.color,
    created_at: domain.createdAt,
  })
  if (error && error.code !== '23505') {
    console.error('[db] insertDomain FAILED:', error.message, 'code:', error.code, 'id:', domain.id)
    return error
  }
  console.log('[db] insertDomain SUCCESS — id:', domain.id)
  return null
}

export async function updateDomain(domain: Domain) {
  if (!supabase) return
  await supabase.from('domains')
    .update({ name: domain.name, icon: domain.icon, color: domain.color })
    .eq('id', domain.id)
}

export async function deleteDomain(id: string) {
  if (!supabase) return
  await supabase.from('domains').delete().eq('id', id)
}

// ─── Goals ────────────────────────────────────────────────────────────────────

export async function loadGoals(userId: string): Promise<Goal[]> {
  if (!supabase) return []
  const { data } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at')
  return (data || []).map((row) => ({
    id:          row.id,
    domainId:    row.domain_id || '',
    challengeId: row.challenge_id || undefined,
    title:       row.title,
    description: row.description || undefined,
    unit:        row.unit || undefined,
    createdAt:   row.created_at,
  }))
}

export async function insertGoal(userId: string, goal: Goal) {
  if (!supabase) return null
  console.log('[db] insertGoal start — id:', goal.id, 'userId:', userId)
  const { error } = await supabase.from('goals').insert({
    id: goal.id, user_id: userId,
    domain_id:    goal.domainId   || null,
    challenge_id: goal.challengeId || null,
    title:        goal.title,
    description:  goal.description || null,
    unit:         goal.unit        || null,
    created_at:   goal.createdAt,
  })
  if (error && error.code !== '23505') {
    console.error('[db] insertGoal FAILED:', error.message, 'code:', error.code, 'id:', goal.id)
    return error
  }
  console.log('[db] insertGoal SUCCESS — id:', goal.id)
  return null
}

export async function updateGoal(goal: Partial<Goal> & { id: string }) {
  if (!supabase) return
  await supabase.from('goals').update({
    title:        goal.title,
    description:  goal.description ?? null,
    unit:         goal.unit ?? null,
    domain_id:    goal.domainId,
    challenge_id: goal.challengeId ?? null,
  }).eq('id', goal.id)
}

export async function deleteGoal(id: string) {
  if (!supabase) return
  await supabase.from('goals').delete().eq('id', id)
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function loadTasks(userId: string): Promise<Task[]> {
  if (!supabase) return []
  const { data } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('scheduled_at')
  return (data || []).map((row) => ({
    id:                row.id,
    title:             row.title,
    domainId:          row.domain_id || undefined,
    goalId:            row.goal_id   || undefined,
    challengeActiveId: row.challenge_active_id || undefined,
    duration:          row.duration  || undefined,
    scheduledAt:       row.scheduled_at,
    done:              row.done,
    doneAt:            row.done_at   || undefined,
    xpValue:           row.xp_value,
    priority:          row.priority  || undefined,
    frequency:         row.frequency || undefined,
    customDays:        row.custom_days || undefined,
    isGenerated:       row.is_generated,
    createdAt:         row.created_at,
  }))
}

export async function insertTask(userId: string, task: Task) {
  if (!supabase) return null
  console.log('[db] insertTask start — id:', task.id, 'title:', task.title, 'userId:', userId)
  const { error } = await supabase.from('tasks').insert({
    id: task.id, user_id: userId,
    domain_id:           task.domainId           || null,
    goal_id:             task.goalId             || null,
    challenge_active_id: task.challengeActiveId  || null,
    title:               task.title,
    duration:            task.duration           || null,
    scheduled_at:        task.scheduledAt,
    done:                task.done,
    done_at:             task.doneAt             || null,
    xp_value:            task.xpValue,
    priority:            task.priority           || null,
    frequency:           task.frequency          || null,
    custom_days:         task.customDays         ?? [],
    is_generated:        task.isGenerated        ?? false,
    created_at:          task.createdAt,
  })
  if (error && error.code !== '23505') {
    console.error('[db] insertTask FAILED:', error.message, 'code:', error.code, 'id:', task.id)
    return error
  }
  console.log('[db] insertTask SUCCESS — id:', task.id)
  return null
}

export async function insertTasks(userId: string, tasks: Task[]) {
  if (!supabase || !tasks.length) return null
  const { error } = await supabase.from('tasks').insert(
    tasks.map((task) => ({
      id: task.id, user_id: userId,
      domain_id:           task.domainId           || null,
      goal_id:             task.goalId             || null,
      challenge_active_id: task.challengeActiveId  || null,
      title:               task.title,
      duration:            task.duration           || null,
      scheduled_at:        task.scheduledAt,
      done:                task.done,
      done_at:             task.doneAt             || null,
      xp_value:            task.xpValue,
      priority:            task.priority           || null,
      frequency:           task.frequency          || null,
      custom_days:         task.customDays         ?? [],
      is_generated:        task.isGenerated        ?? false,
      created_at:          task.createdAt,
    }))
  )
  if (error && error.code !== '23505') {
    console.error('[db] insertTasks FAILED:', error.message)
    return error
  }
  return null
}

export async function updateTask(task: Partial<Task> & { id: string }) {
  if (!supabase) return
  const patch: Record<string, any> = {}
  if (task.title       !== undefined) patch.title        = task.title
  if (task.done        !== undefined) patch.done         = task.done
  if (task.doneAt      !== undefined) patch.done_at      = task.doneAt
  if (task.scheduledAt !== undefined) patch.scheduled_at = task.scheduledAt
  if (task.domainId    !== undefined) patch.domain_id    = task.domainId
  if (task.goalId      !== undefined) patch.goal_id      = task.goalId
  if (task.duration    !== undefined) patch.duration     = task.duration
  if (task.priority    !== undefined) patch.priority     = task.priority
  await supabase.from('tasks').update(patch).eq('id', task.id)
}

export async function deleteTask(id: string) {
  if (!supabase) return
  await supabase.from('tasks').delete().eq('id', id)
}

export async function deleteTasksByChallenge(challengeActiveId: string) {
  if (!supabase) return
  await supabase.from('tasks')
    .delete()
    .eq('challenge_active_id', challengeActiveId)
    .eq('done', false)
}

// ─── Custom Challenges ────────────────────────────────────────────────────────

export async function loadCustomChallenges(userId: string): Promise<Challenge[]> {
  if (!supabase) return []
  const { data } = await supabase
    .from('custom_challenges')
    .select('*')
    .eq('user_id', userId)
  return (data || []).map((row) => ({
    id:           row.id,
    title:        row.title,
    description:  row.description || '',
    durationDays: row.duration_days,
    deadline:     row.deadline || undefined,
    color:        row.color,
    icon:         row.icon,
    blueprints:   row.blueprints || [],
  }))
}

export async function upsertCustomChallenge(userId: string, challenge: Challenge) {
  if (!supabase) return
  await supabase.from('custom_challenges').upsert({
    id: challenge.id, user_id: userId,
    title:         challenge.title,
    description:   challenge.description,
    duration_days: challenge.durationDays,
    deadline:      challenge.deadline || null,
    color:         challenge.color,
    icon:          challenge.icon,
    blueprints:    challenge.blueprints,
  }, { onConflict: 'id' })
}


export async function insertCustomChallenge(userId: string, challenge: Challenge) {
  if (!supabase) return
  await supabase.from('custom_challenges').insert({
    id:            challenge.id,
    user_id:       userId,
    title:         challenge.title,
    description:   challenge.description,
    duration_days: challenge.durationDays,
    deadline:      challenge.deadline || null,
    color:         challenge.color,
    icon:          challenge.icon,
    blueprints:    challenge.blueprints,
  })
}

export async function updateCustomChallenge(challenge: Partial<Challenge> & { id: string }) {
  if (!supabase) return
  await supabase.from('custom_challenges').update({
    title:         challenge.title,
    description:   challenge.description,
    duration_days: challenge.durationDays,
    deadline:      challenge.deadline || null,
    color:         challenge.color,
    icon:          challenge.icon,
    blueprints:    challenge.blueprints,
  }).eq('id', challenge.id)
}

export async function deleteGoalsByDomain(domainId: string) {
  if (!supabase) return
  await supabase.from('goals').delete().eq('domain_id', domainId)
}

export async function deleteCustomChallenge(id: string) {
  if (!supabase) return
  await supabase.from('custom_challenges').delete().eq('id', id)
}

// ─── Active Challenges ────────────────────────────────────────────────────────

export async function loadActiveChallenges(userId: string): Promise<ActiveChallenge[]> {
  if (!supabase) return []
  const { data } = await supabase
    .from('active_challenges')
    .select('*')
    .eq('user_id', userId)
  return (data || []).map((row) => ({
    id:           row.id,
    challengeId:  row.challenge_id,
    startDate:    row.start_date,
    endDate:      row.end_date,
    isActive:     row.is_active,
    currentDay:   row.current_day,
    createdAt:    row.created_at,
  }))
}

export async function insertActiveChallenge(userId: string, ac: ActiveChallenge) {
  if (!supabase) return
  await supabase.from('active_challenges').insert({
    id: ac.id, user_id: userId,
    challenge_id: ac.challengeId,
    start_date:   ac.startDate,
    end_date:     ac.endDate,
    is_active:    ac.isActive,
    current_day:  ac.currentDay,
    created_at:   ac.createdAt,
  })
}

export async function updateActiveChallenge(id: string, patch: { isActive?: boolean; currentDay?: number }) {
  if (!supabase) return
  const dbPatch: Record<string, any> = {}
  if (patch.isActive   !== undefined) dbPatch.is_active    = patch.isActive
  if (patch.currentDay !== undefined) dbPatch.current_day  = patch.currentDay
  await supabase.from('active_challenges').update(dbPatch).eq('id', id)
}

// ════════════════════════════════════════════════════════════════════════════
// Sync incrémentale — charge uniquement ce qui a changé depuis lastSyncedAt
// ════════════════════════════════════════════════════════════════════════════

export async function loadDomainsSince(userId: string, since: string): Promise<Domain[]> {
  if (!supabase) return []
  const { data } = await supabase
    .from('domains')
    .select('*')
    .eq('user_id', userId)
    .gt('updated_at', since)
    .order('created_at')
  return (data || []).map((row) => ({
    id:        row.id,
    userId:    row.user_id,
    name:      row.name,
    icon:      row.icon,
    color:     row.color,
    createdAt: row.created_at,
  }))
}

export async function loadGoalsSince(userId: string, since: string): Promise<Goal[]> {
  if (!supabase) return []
  const { data } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .gt('updated_at', since)
    .order('created_at')
  return (data || []).map((row) => ({
    id:          row.id,
    domainId:    row.domain_id || '',
    challengeId: row.challenge_id || undefined,
    title:       row.title,
    description: row.description || undefined,
    unit:        row.unit || undefined,
    createdAt:   row.created_at,
  }))
}

export async function loadTasksSince(userId: string, since: string): Promise<Task[]> {
  if (!supabase) return []
  const { data } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .gt('updated_at', since)
    .order('scheduled_at')
  return (data || []).map((row) => ({
    id:                row.id,
    title:             row.title,
    domainId:          row.domain_id           || undefined,
    goalId:            row.goal_id             || undefined,
    challengeActiveId: row.challenge_active_id || undefined,
    duration:          row.duration            || undefined,
    scheduledAt:       row.scheduled_at,
    done:              row.done,
    doneAt:            row.done_at             || undefined,
    xpValue:           row.xp_value,
    priority:          row.priority            || undefined,
    frequency:         row.frequency           || undefined,
    customDays:        row.custom_days         || undefined,
    isGenerated:       row.is_generated,
    createdAt:         row.created_at,
  }))
}

export async function loadCustomChallengesSince(userId: string, since: string): Promise<Challenge[]> {
  if (!supabase) return []
  const { data } = await supabase
    .from('custom_challenges')
    .select('*')
    .eq('user_id', userId)
    .gt('updated_at', since)
    .order('created_at')
  return (data || []).map((row) => ({
    id:           row.id,
    title:        row.title,
    description:  row.description,
    durationDays: row.duration_days,
    deadline:     row.deadline || undefined,
    color:        row.color,
    icon:         row.icon,
    blueprints:   row.blueprints || [],
  }))
}

export async function loadActiveChallengesSince(userId: string, since: string): Promise<ActiveChallenge[]> {
  if (!supabase) return []
  const { data } = await supabase
    .from('active_challenges')
    .select('*')
    .eq('user_id', userId)
    .gt('updated_at', since)
    .order('created_at')
  return (data || []).map((row) => ({
    id:          row.id,
    challengeId: row.challenge_id,
    startDate:   row.start_date,
    endDate:     row.end_date,
    isActive:    row.is_active,
    currentDay:  row.current_day,
    createdAt:   row.created_at,
  }))
}
