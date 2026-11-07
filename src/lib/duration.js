export const MIN_TASK_MINUTES = 1
export const MAX_TASK_MINUTES = 1440

const clamp = (value) => Math.min(MAX_TASK_MINUTES, Math.max(MIN_TASK_MINUTES, value))

export function parseDurationMinutes(value) {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') return Number.isInteger(value) && value >= MIN_TASK_MINUTES && value <= MAX_TASK_MINUTES ? value : null

  const text = String(value).trim().toLowerCase()
  if (!text) return null
  if (/^\d{1,4}$/.test(text)) {
    const minutes = Number(text)
    return minutes >= MIN_TASK_MINUTES && minutes <= MAX_TASK_MINUTES ? minutes : null
  }

  let match = text.match(/^(\d{1,2}):(\d{2})$/)
  if (match) {
    const minutes = Number(match[1]) * 60 + Number(match[2])
    return minutes >= MIN_TASK_MINUTES && minutes <= MAX_TASK_MINUTES ? minutes : null
  }

  match = text.match(/^(\d{1,2})\s*(?:h|heures?|hrs?)\s*(\d{1,2})?\s*(?:min|m|minutes?)?$/)
  if (match) {
    const minutes = Number(match[1]) * 60 + Number(match[2] ?? 0)
    return minutes >= MIN_TASK_MINUTES && minutes <= MAX_TASK_MINUTES ? minutes : null
  }

  match = text.match(/^(\d{1,4})\s*(?:min|m|minutes?)$/)
  if (match) {
    const minutes = Number(match[1])
    return minutes >= MIN_TASK_MINUTES && minutes <= MAX_TASK_MINUTES ? minutes : null
  }

  return null
}

export function formatDurationMinutes(minutes) {
  const value = Number(minutes)
  if (!Number.isFinite(value) || value <= 0) return ''
  const total = Math.round(value)
  const hours = Math.floor(total / 60)
  const rest = total % 60
  if (hours && rest) return `${hours} h ${String(rest).padStart(2, '0')}`
  if (hours) return `${hours} h`
  return `${rest} min`
}

export function taskMinutes(task) {
  return parseDurationMinutes(task?.duration_minutes ?? task?.duration)
}

export function durationFieldValue(minutes) {
  return minutes ? String(minutes) : ''
}

export function clampTaskMinutes(value) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return null
  return clamp(Math.round(parsed))
}
