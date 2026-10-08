// Client du Coach IA : envoie le contexte JSON à la fonction serveur /api/coach et
// renvoie le texte généré. Le timeout client est légèrement supérieur au timeout
// serveur (20 s) pour laisser arriver les erreurs structurées.

import { supabase } from '../lib/supabase.js'
import { AppError } from '../lib/errors.js'

const TIMEOUT_MS = 25_000

export async function askCoach(context) {
  const { data, error } = await supabase.auth.getSession()
  if (error || !data?.session) throw new AppError('Session expirée. Reconnectez-vous.')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch('/api/coach', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${data.session.access_token}`,
      },
      body: JSON.stringify({ context }),
    })
    const body = await res.json().catch(() => null)
    if (!res.ok) throw new AppError(body?.error ?? 'Le coach est indisponible. Réessayez plus tard.')
    if (!body?.text) throw new AppError('Le coach a renvoyé une réponse vide.')
    return body.text
  } catch (error) {
    if (error?.name === 'AbortError') throw new AppError('Le coach met trop de temps à répondre. Réessayez.')
    if (error instanceof AppError) throw error
    throw new AppError('Impossible de joindre le serveur. Vérifiez votre connexion.')
  } finally {
    clearTimeout(timer)
  }
}
