// Utilitaires purs du mode Focus : durées, formatage et état de session.
// Le minuteur stocke des horodatages réels afin de rester exact après une pause, une veille ou un verrouillage.

export const MAX_FOCUS_SECONDS = 23 * 3600 + 59 * 60 + 59
export const MAX_FOCUS_MS = MAX_FOCUS_SECONDS * 1000
export const QUICK_FOCUS_MINUTES = [15, 25, 45, 60]

const pad = (value) => String(value).padStart(2, '0')

function part(value) {
  if (value === '' || value === null || value === undefined) return 0
  const n = Number(value)
  return Number.isFinite(n) ? n : NaN
}

// Valide une durée libre en heures/minutes/secondes et renvoie { ok, ms } ou { ok: false, error }.
export function durationFromParts({ hours = 0, minutes = 0, seconds = 0 } = {}) {
  const h = part(hours)
  const m = part(minutes)
  const s = part(seconds)
  if ([h, m, s].some(Number.isNaN)) return { ok: false, error: 'Saisissez des nombres entiers.' }
  if (![h, m, s].every(Number.isInteger)) return { ok: false, error: 'Saisissez des nombres entiers.' }
  if (h < 0 || m < 0 || s < 0) return { ok: false, error: 'La durée ne peut pas être négative.' }
  if (h > 23) return { ok: false, error: 'Les heures doivent être comprises entre 0 et 23.' }
  if (m > 59 || s > 59) return { ok: false, error: 'Les minutes et les secondes doivent être comprises entre 0 et 59.' }
  const totalSeconds = h * 3600 + m * 60 + s
  if (totalSeconds <= 0) return { ok: false, error: 'Choisissez une durée supérieure à 0 seconde.' }
  if (totalSeconds > MAX_FOCUS_SECONDS) return { ok: false, error: 'La durée ne peut pas dépasser 23 h 59 min 59 s.' }
  return { ok: true, ms: totalSeconds * 1000, seconds: totalSeconds }
}

// Le format HH:MM:SS n'apparaît que tant qu'il reste au moins une heure.
export function splitFocusTime(remainingMs) {
  const totalSeconds = Math.max(0, Math.ceil(Number(remainingMs) / 1000) || 0)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const showHours = totalSeconds >= 3600
  return {
    showHours,
    hours: pad(hours),
    minutes: pad(minutes),
    seconds: pad(seconds),
    text: showHours ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`,
  }
}

export function formatFocusTime(remainingMs) {
  return splitFocusTime(remainingMs).text
}

export function formatDurationLabel(ms) {
  const totalSeconds = Math.max(0, Math.ceil(Number(ms) / 1000) || 0)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const parts = []
  if (hours) parts.push(`${hours} h`)
  if (minutes) parts.push(`${minutes} min`)
  if (seconds) parts.push(`${seconds} s`)
  return parts.join(' ') || '0 s'
}

// La base ne stocke que des minutes entières : on arrondit au supérieur pour ne pas sous-compter.
export function focusSessionMinutes(ms) {
  return Math.min(1440, Math.max(1, Math.ceil((Number(ms) || 0) / 60_000)))
}

export function createFocusSession(durationMs, task = null, now = Date.now()) {
  const totalMs = Math.max(1, Math.min(Number(durationMs) || 0, MAX_FOCUS_MS))
  return {
    totalMs,
    remainingMs: totalMs,
    endsAt: now + totalMs,
    paused: false,
    minutes: focusSessionMinutes(totalMs),
    taskId: task?.id ?? null,
    taskTitle: task?.title ?? null,
  }
}

export function pauseFocusSession(session, now = Date.now()) {
  if (!session || session.paused) return session
  const remainingMs = Math.max(0, session.endsAt - now)
  if (remainingMs <= 0) return session
  return { ...session, paused: true, remainingMs, endsAt: null }
}

export function resumeFocusSession(session, now = Date.now()) {
  if (!session || !session.paused) return session
  const remainingMs = Math.max(0, Math.min(session.remainingMs ?? session.totalMs, session.totalMs))
  return { ...session, paused: false, remainingMs, endsAt: now + remainingMs }
}

export function remainingFocusMs(session, now = Date.now()) {
  if (!session) return 0
  if (session.paused) return Math.max(0, session.remainingMs ?? 0)
  return Math.max(0, session.endsAt - now)
}

// Compatibilité avec les sessions déjà sauvegardées avant l'ajout de totalMs/pause.
export function normalizeFocusSession(raw, now = Date.now()) {
  if (!raw || typeof raw !== 'object') return null
  const rawTotal = Number(raw.totalMs)
  const legacyTotal = Number(raw.minutes) > 0 ? Number(raw.minutes) * 60_000 : 0
  const totalMs = rawTotal > 0 ? Math.min(rawTotal, MAX_FOCUS_MS) : legacyTotal > 0 ? Math.min(legacyTotal, MAX_FOCUS_MS) : 0
  if (!totalMs) return null

  if (raw.paused === true) {
    const remainingMs = Number(raw.remainingMs)
    if (!Number.isFinite(remainingMs) || remainingMs <= 0) return null
    return {
      ...raw,
      totalMs,
      remainingMs: Math.min(remainingMs, totalMs),
      endsAt: null,
      paused: true,
      minutes: focusSessionMinutes(totalMs),
    }
  }

  const endsAt = Number(raw.endsAt)
  if (!Number.isFinite(endsAt)) return null
  return {
    ...raw,
    totalMs,
    remainingMs: Math.max(0, endsAt - now),
    endsAt,
    paused: false,
    minutes: focusSessionMinutes(totalMs),
  }
}
