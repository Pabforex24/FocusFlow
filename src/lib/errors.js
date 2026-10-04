// Toute erreur affichée à l'utilisateur passe par ici : message clair, jamais silencieux.

export class AppError extends Error {
  constructor(message, cause) {
    super(message)
    this.name = 'AppError'
    this.cause = cause
  }
}

export function toUserMessage(error) {
  if (!error) return 'Une erreur inconnue est survenue.'
  if (error instanceof AppError) return error.message
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return 'Pas de connexion internet. Vérifiez votre réseau puis réessayez.'
  }
  const code = error.code
  const msg = String(error.message || '')
  if (code === '23505') return 'Cet élément existe déjà.'
  if (code === '23503') return 'Cet élément dépend d\'une donnée qui n\'existe plus. Actualisez la page.'
  if (code === '42501' || code === 'PGRST301') return 'Accès refusé. Reconnectez-vous puis réessayez.'
  if (code === '42P01') return 'La base de données n\'est pas initialisée (exécutez supabase/schema.sql).'
  if (/invalid login credentials/i.test(msg)) return 'Email ou mot de passe incorrect.'
  if (/already registered/i.test(msg)) return 'Un compte existe déjà avec cet email.'
  if (/password should be at least/i.test(msg)) return 'Le mot de passe est trop court.'
  if (/same password|different from the old/i.test(msg)) return 'Choisissez un mot de passe différent de l\'ancien.'
  if (/rate limit|too many/i.test(msg)) return 'Trop de tentatives. Patientez quelques minutes puis réessayez.'
  if (/email not confirmed/i.test(msg)) return 'Confirmez votre email avant de vous connecter.'
  if (/failed to fetch|networkerror|load failed/i.test(msg)) return 'Impossible de joindre le serveur. Vérifiez votre connexion.'
  if (/timeout/i.test(msg)) return 'Le serveur met trop de temps à répondre. Réessayez.'
  return 'Une erreur est survenue : ' + msg
}
