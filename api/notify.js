// Fonction Vercel appelée par pg_cron (Supabase) toutes les 10 minutes.
// Elle envoie les rappels push dus (rappel quotidien / alerte de série) et tient le journal
// anti-doublon push_log — accessible uniquement par la clé service_role.

import webpush from 'web-push'
import { addDays } from '../src/lib/dates.js'
import { computeStats } from '../src/lib/gamification.js'
import { STREAK_FROM_HOUR, decideReminder, localDateKey, localHour } from '../src/lib/notifications.js'

const MAX_USERS = 200    // plafond par cycle (durée de fonction + charge)
const HISTORY_DAYS = 60  // fenêtre de calcul de la série
const PUSH_TTL = 3600    // la notification expire après 1 h si l'appareil reste hors ligne

export const maxDuration = 60

const json = (status, body) => Response.json(body, { status })

// Petit client REST Supabase en service_role (contourne la RLS : push_log n'a aucune politique).
const rest = (path, init = {}) =>
  fetch(`${process.env.SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
  })

async function select(path) {
  const res = await rest(path)
  if (!res.ok) throw new Error(`supabase ${res.status}: ${await res.text().catch(() => '')}`)
  return res.json()
}

// Réclame l'envoi (verrou) : renvoie false si ce rappel est déjà parti aujourd'hui.
async function claim(userId, kind, day) {
  const res = await rest('push_log?on_conflict=user_id,kind,day&select=user_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=ignore-duplicates,return=representation' },
    body: JSON.stringify({ user_id: userId, kind, day }),
  })
  if (!res.ok) throw new Error(`claim ${res.status}`)
  return (await res.json()).length > 0
}

// Libère le verrou quand rien n'a pu être envoyé (permet un nouvel essai au prochain cycle).
const release = (userId, kind, day) =>
  rest(`push_log?user_id=eq.${userId}&kind=eq.${kind}&day=eq.${day}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } }).catch(() => {})

const dropSubscription = (endpoint) =>
  rest(`push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } }).catch(() => {})

// Renvoie le nombre d'appareils notifiés (0 si rien n'a été envoyé).
async function processUser(profile, now) {
  const timezone = profile.timezone || 'UTC'
  const today = localDateKey(now, timezone)
  const since = addDays(today, -HISTORY_DAYS)

  const [tasks, rests, sessions, subs] = await Promise.all([
    select(`tasks?user_id=eq.${profile.id}&scheduled_on=gte.${since}&select=id,scheduled_on,done`),
    select(`rest_days?user_id=eq.${profile.id}&select=day`),
    select(`focus_sessions?user_id=eq.${profile.id}&completed_on=gte.${since}&select=id`),
    select(`push_subscriptions?user_id=eq.${profile.id}&select=endpoint,p256dh,auth`),
  ])
  if (subs.length === 0) return 0

  const restDays = rests.map((r) => r.day)
  const stats = computeStats({ tasks, restDays, focusSessions: sessions, today })
  const reminder = decideReminder({
    profile,
    stats,
    tasksToday: tasks.filter((t) => t.scheduled_on === today),
    restToday: restDays.includes(today),
    now,
  })
  if (!reminder) return 0
  if (!(await claim(profile.id, reminder.kind, today))) return 0 // déjà envoyé aujourd'hui

  let sent = 0
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ ...reminder, tag: reminder.kind }),
        { TTL: PUSH_TTL },
      )
      sent += 1
    } catch (error) {
      const status = error?.statusCode
      if (status === 404 || status === 410) await dropSubscription(sub.endpoint) // abonnement expiré
      else console.error('[notify] envoi échoué', status ?? error?.message)
    }
  }
  if (sent === 0) await release(profile.id, reminder.kind, today)
  return sent
}

export async function POST(request) {
  const { CRON_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env
  const publicKey = process.env.VITE_VAPID_PUBLIC_KEY
  if (!CRON_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT || !publicKey) {
    console.error('[notify] variables manquantes (CRON_SECRET / SUPABASE_* / VAPID_*)')
    return json(503, { error: 'Notifications non configurées sur le serveur.' })
  }
  if ((request.headers.get('authorization') ?? '') !== `Bearer ${CRON_SECRET}`) {
    return json(401, { error: 'Non autorisé.' })
  }

  webpush.setVapidDetails(VAPID_SUBJECT, publicKey, VAPID_PRIVATE_KEY)
  const now = new Date()

  try {
    const profiles = await select(`profiles?remind_enabled=eq.true&select=id,remind_enabled,remind_hour,timezone&limit=${MAX_USERS}`)
    // On ne charge les données que des utilisateurs dont c'est peut-être l'heure.
    const due = profiles.filter((p) => {
      const hour = localHour(now, p.timezone)
      return hour === p.remind_hour || hour >= STREAK_FROM_HOUR
    })

    let notified = 0
    let sent = 0
    for (const profile of due) {
      const count = await processUser(profile, now)
      if (count > 0) { notified += 1; sent += count }
    }
    return json(200, { candidates: profiles.length, due: due.length, notified, sent })
  } catch (error) {
    console.error('[notify]', String(error?.message ?? error))
    return json(502, { error: 'Envoi des notifications impossible.' })
  }
}

// GET = diagnostic protégé par le même secret que le cron. N'envoie rien : permet de vérifier
// que la fonction est déployée et que toutes les variables serveur sont bien présentes.
export function GET(request) {
  const { CRON_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env
  const publicKey = process.env.VITE_VAPID_PUBLIC_KEY
  if (!CRON_SECRET || (request.headers.get('authorization') ?? '') !== `Bearer ${CRON_SECRET}`) {
    return json(401, { error: 'Non autorisé.' })
  }
  const config = {
    CRON_SECRET: Boolean(CRON_SECRET),
    SUPABASE_URL: Boolean(SUPABASE_URL),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(SUPABASE_SERVICE_ROLE_KEY),
    VAPID_PRIVATE_KEY: Boolean(VAPID_PRIVATE_KEY),
    VAPID_SUBJECT: Boolean(VAPID_SUBJECT),
    VITE_VAPID_PUBLIC_KEY: Boolean(publicKey),
  }
  return json(200, { ok: Object.values(config).every(Boolean), config })
}
