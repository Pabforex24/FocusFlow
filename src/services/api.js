// Couche d'accès à Supabase. Chaque fonction renvoie les données ou lève une erreur :
// aucune erreur n'est avalée ici, l'appelant (DataContext) décide de l'afficher.

import { supabase } from '../lib/supabase.js'
import { AppError } from '../lib/errors.js'
import { fetchAllPages } from '../lib/paginate.js'

const TIMEOUT_MS = 15000

function client() {
  if (!supabase) throw new AppError('Supabase n\'est pas configuré (voir .env.example).')
  return supabase
}

async function run(query) {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new AppError('Le serveur met trop de temps à répondre (timeout).')), TIMEOUT_MS)
  })
  try {
    const { data, error } = await Promise.race([query, timeout])
    if (error) throw error
    return data
  } finally {
    clearTimeout(timer)
  }
}

// ── Chargement complet : la base est la source de vérité ──────────────────────
// Lit toutes les lignes d'une table, page par page (voir lib/paginate.js). `id` départage les lignes de même date :
// sans ordre stable, une ligne pourrait être lue deux fois ou jamais d'une page à l'autre.
const readAll = (table, columns, orders) => fetchAllPages((from, to) => {
  let query = client().from(table).select(columns)
  for (const [column, ascending = true] of [...orders, ['id']]) query = query.order(column, { ascending })
  return run(query.range(from, to))
})

export async function loadAll(userId) {
  const db = client()
  // Sans session valide, Supabase répondrait par des listes VIDES (règles RLS) et non par une erreur : on les refuserait
  // à tort comme données réelles et on écraserait la copie locale. On exige donc une session.
  const { data: auth } = await db.auth.getSession()
  if (!auth?.session) throw new AppError('Session expirée ou introuvable. Reconnectez-vous.')
  const [profile, domains, goals, tasks, activeChallenges, customChallenges, restDays, focusSessions] = await Promise.all([
    run(db.from('profiles').select('*').eq('id', userId).maybeSingle()),
    readAll('domains', '*', [['created_at']]),
    readAll('goals', '*', [['created_at']]),
    readAll('tasks', '*', [['scheduled_on'], ['created_at']]),
    readAll('active_challenges', '*', [['created_at', false]]),
    readAll('custom_challenges', '*', [['created_at', false]]),
    readAll('rest_days', 'day', [['day']]),
    readAll('focus_sessions', '*', [['created_at']]),
  ])
  return { profile, domains, goals, tasks, activeChallenges, customChallenges, restDays: restDays.map((r) => r.day), focusSessions }
}

const insertOne = (table, row) => run(client().from(table).insert(row).select().single())
const updateOne = (table, id, patch) => run(client().from(table).update(patch).eq('id', id).select().single())
const removeOne = (table, id) => run(client().from(table).delete().eq('id', id))

// ── Domaines / objectifs ──────────────────────────────────────────────────────
export const createDomain = (userId, d) => insertOne('domains', { ...d, user_id: userId })
export const updateDomain = (id, patch) => updateOne('domains', id, patch)
export const deleteDomain = (id) => removeOne('domains', id)

export const createGoal = (userId, g) => insertOne('goals', { ...g, user_id: userId })
export const updateGoal = (id, patch) => updateOne('goals', id, patch)
export const deleteGoal = (id) => removeOne('goals', id)

// ── Tâches ────────────────────────────────────────────────────────────────────
export const createTask = (userId, t) => insertOne('tasks', { ...t, user_id: userId })
export const createTasks = (userId, rows) =>
  run(client().from('tasks').insert(rows.map((r) => ({ ...r, user_id: userId }))).select())
export const updateTask = (id, patch) => updateOne('tasks', id, patch)
export const deleteTask = (id) => removeOne('tasks', id)

// ── Challenges ────────────────────────────────────────────────────────────────
// Démarrage en deux temps avec retour arrière : pas de challenge "vide" si l'insertion des tâches échoue.
export async function startChallenge(userId, active, taskRows) {
  const challenge = await insertOne('active_challenges', { ...active, user_id: userId })
  try {
    const tasks = await createTasks(userId, taskRows.map((r) => ({ ...r, challenge_active_id: challenge.id })))
    return { challenge, tasks }
  } catch (error) {
    await removeOne('active_challenges', challenge.id).catch(() => {})
    throw error
  }
}
// Les tâches du challenge sont supprimées par cascade (on delete cascade).
export const deleteActiveChallenge = (id) => removeOne('active_challenges', id)

export const createCustomChallenge = (userId, c) => insertOne('custom_challenges', { ...c, user_id: userId })
export const updateCustomChallenge = (id, patch) => updateOne('custom_challenges', id, patch)
export const deleteCustomChallenge = (id) => removeOne('custom_challenges', id)

// ── Profil, repos, focus ──────────────────────────────────────────────────────
export const updateProfile = (id, patch) => updateOne('profiles', id, patch)
export const addRestDay = (userId, day) => insertOne('rest_days', { user_id: userId, day })
export const addFocusSession = (userId, s) => insertOne('focus_sessions', { ...s, user_id: userId })
