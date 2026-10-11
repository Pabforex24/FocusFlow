// Fonction Vercel : envoie une notification push de TEST à l'utilisateur connecté.
// Sert à vérifier de bout en bout (serveur → Apple/Google → appareil) que les rappels peuvent
// arriver, indépendamment de la planification pg_cron. Réservé à la session de l'utilisateur :
// on n'envoie qu'à SES propres abonnements.

import webpush from 'web-push'

export const maxDuration = 30

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const PUBLIC_KEY = process.env.VITE_VAPID_PUBLIC_KEY

const json = (status, body) => Response.json(body, { status })

// Vérifie le jeton Supabase auprès de /auth/v1/user : aucune clé secrète nécessaire.
async function verifySession(request) {
  const token = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!token) return null
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_ANON_KEY ?? '', Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

// REST Supabase en service_role (contourne la RLS pour lire/écraser des abonnements).
const rest = (path, init = {}) =>
  fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
  })

export async function POST(request) {
  const { VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env
  if (!PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT || !SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_KEY) {
    console.error('[push-test] variables serveur manquantes')
    return json(503, { error: 'Notifications non configurées sur le serveur.' })
  }

  const user = await verifySession(request)
  if (!user?.id) return json(401, { error: 'Session invalide. Reconnectez-vous.' })

  let subs
  try {
    const res = await rest(`push_subscriptions?user_id=eq.${user.id}&select=endpoint,p256dh,auth`)
    if (!res.ok) throw new Error(`supabase ${res.status}`)
    subs = await res.json()
  } catch (error) {
    console.error('[push-test]', String(error?.message ?? error))
    return json(502, { error: 'Lecture des abonnements impossible.' })
  }
  if (!Array.isArray(subs) || subs.length === 0) return json(200, { ok: false, reason: 'no-subscription', sent: 0 })

  webpush.setVapidDetails(VAPID_SUBJECT, PUBLIC_KEY, VAPID_PRIVATE_KEY)
  const payload = JSON.stringify({
    title: 'FocusFlow · test',
    body: 'Si tu vois ceci, les notifications push fonctionnent sur cet appareil.',
    url: '/',
    tag: 'focusflow-test',
  })

  let sent = 0
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
        { TTL: 60 },
      )
      sent += 1
    } catch (error) {
      const status = error?.statusCode
      if (status === 404 || status === 410) {
        await rest(`push_subscriptions?endpoint=eq.${encodeURIComponent(sub.endpoint)}`, { method: 'DELETE' }).catch(() => {})
      } else {
        console.error('[push-test] envoi échoué', status ?? error?.message)
      }
    }
  }

  return json(200, { ok: sent > 0, sent, total: subs.length, reason: sent > 0 ? null : 'send-failed' })
}

// Diagnostic : quelles variables serveur sont présentes (sans valeurs).
export function GET() {
  const config = {
    SUPABASE_URL: Boolean(SUPABASE_URL),
    SUPABASE_ANON_KEY: Boolean(SUPABASE_ANON_KEY),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(SERVICE_KEY),
    VITE_VAPID_PUBLIC_KEY: Boolean(PUBLIC_KEY),
    VAPID_PRIVATE_KEY: Boolean(process.env.VAPID_PRIVATE_KEY),
    VAPID_SUBJECT: Boolean(process.env.VAPID_SUBJECT),
  }
  return json(200, { ok: Object.values(config).every(Boolean), config })
}
