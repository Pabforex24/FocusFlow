// Fonction Vercel : Coach IA via Groq. La clé API reste côté serveur (jamais dans le
// navigateur) et le system prompt est fixe ici — le client n'envoie que le contexte JSON
// produit par src/lib/coachContext.js, il ne peut donc pas détourner le rôle du coach.

import { coachMessages } from '../src/lib/coachContext.js'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
// llama-3.3-70b-versatile a été retiré par Groq le 16/08/2026 ; gpt-oss-120b est son remplacement
// de production recommandé (voir GROQ_MODEL pour changer sans redéployer de code).
const DEFAULT_MODEL = 'openai/gpt-oss-120b'

// Supabase : on accepte les noms serveur (SUPABASE_*) comme ceux du build (VITE_*), pour qu'une
// seule paire de variables Vercel suffise (Vite n'expose au navigateur que les VITE_*, mais Vercel
// les fournit aussi au runtime des fonctions).
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
const TIMEOUT_MS = 20_000
const MAX_BODY_CHARS = 20_000
const RATE_LIMIT = 10 // demandes par utilisateur et par minute (best effort, par instance chaude)

export const maxDuration = 30

// Limitation simple en mémoire : suffit pour protéger le quota Groq côté utilisateur.
const hits = new Map()

const json = (status, body) => Response.json(body, { status })

function rateLimited(userId) {
  const now = Date.now()
  const list = (hits.get(userId) ?? []).filter((t) => now - t < 60_000)
  if (list.length >= RATE_LIMIT) {
    hits.set(userId, list)
    return true
  }
  list.push(now)
  hits.set(userId, list)
  return false
}

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

export async function POST(request) {
  const { GROQ_API_KEY, GROQ_MODEL } = process.env
  if (!GROQ_API_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('[coach] variables manquantes (GROQ_API_KEY / SUPABASE_URL / SUPABASE_ANON_KEY)')
    return json(503, { error: 'Coach IA non configuré sur le serveur.' })
  }

  const user = await verifySession(request)
  if (!user?.id) return json(401, { error: 'Session invalide. Reconnectez-vous.' })
  if (rateLimited(user.id)) return json(429, { error: 'Trop de demandes. Réessayez dans une minute.' })

  const raw = await request.text().catch(() => '')
  if (raw.length > MAX_BODY_CHARS) return json(413, { error: 'Contexte trop volumineux.' })
  let context
  try {
    context = JSON.parse(raw)?.context
  } catch {
    context = undefined
  }
  if (!context || typeof context !== 'object' || Array.isArray(context)) {
    return json(400, { error: 'Requête invalide.' })
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: GROQ_MODEL || DEFAULT_MODEL,
        messages: coachMessages(context),
        temperature: 0.6,
        // Les modèles gpt-oss raisonnent avant de répondre : on borne brièvement le raisonnement
        // et on laisse assez de place pour la réponse finale.
        reasoning_effort: 'low',
        max_tokens: 1024,
      }),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      console.error(`[coach] groq ${res.status} ${data?.error?.message ?? ''}`.trim())
      return json(502, { error: 'Le coach est momentanément indisponible. Réessayez plus tard.' })
    }
    const text = data?.choices?.[0]?.message?.content
    if (!text) return json(502, { error: 'Le coach a renvoyé une réponse vide.' })
    return json(200, { text })
  } catch (error) {
    console.error('[coach]', error?.name === 'AbortError' ? 'timeout' : String(error?.message ?? error))
    return json(504, { error: 'Le coach met trop de temps à répondre. Réessayez.' })
  } finally {
    clearTimeout(timer)
  }
}

// La route n'existe que pour le bouton « Analyser » : les autres méthodes sont rejetées.
// GET est un diagnostic : indique quelles variables serveur sont présentes (pas leurs valeurs).
export function GET() {
  const { GROQ_API_KEY, GROQ_MODEL } = process.env
  const config = {
    GROQ_API_KEY: Boolean(GROQ_API_KEY),
    GROQ_MODEL: Boolean(GROQ_MODEL),
    SUPABASE_URL: Boolean(SUPABASE_URL),
    SUPABASE_ANON_KEY: Boolean(SUPABASE_ANON_KEY),
    // Pour le diagnostic : on indique aussi les variables VITE_* déjà présentes.
    VITE_SUPABASE_URL: Boolean(process.env.VITE_SUPABASE_URL),
    VITE_SUPABASE_ANON_KEY: Boolean(process.env.VITE_SUPABASE_ANON_KEY),
  }
  return json(200, { ok: Boolean(GROQ_API_KEY && SUPABASE_URL && SUPABASE_ANON_KEY), config })
}
export function PUT() {
  return GET()
}
export function DELETE() {
  return GET()
}
