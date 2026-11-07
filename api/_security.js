// Utilitaires partagés par les fonctions serveur.
// Le préfixe « _ » indique à Vercel que ce fichier n'est PAS un endpoint public.

import { timingSafeEqual } from 'node:crypto'

export const json = (status, body) => Response.json(body, { status })

// Comparaison à temps constant : un secret ne doit pas pouvoir être deviné caractère
// par caractère en mesurant le temps de réponse. Les longueurs différentes sont
// refusées avant l'appel (timingSafeEqual exige deux buffers de même taille).
export function secretMatches(request, secret) {
  if (!secret) return false
  const supplied = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!supplied) return false
  const a = Buffer.from(supplied)
  const b = Buffer.from(secret)
  return a.length === b.length && timingSafeEqual(a, b)
}
