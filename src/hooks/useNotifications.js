'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useStore } from '@/store'
import { isSameDay, subMinutes, format } from 'date-fns'
import { fr } from 'date-fns/locale'

// ── Types ────────────────────────────────────────────────────────────────────


// ── Clés localStorage ────────────────────────────────────────────────────────
const KEY_REMINDER_MINUTES  = 'ff_reminder_minutes'
const KEY_STREAK_ALERT      = 'ff_streak_alert'
const KEY_STREAK_HOUR       = 'ff_streak_hour'
const KEY_LAST_STREAK_NOTIF = 'ff_last_streak_notif'

// ── Helper SSR-safe ───────────────────────────────────────────────────────────
const isClient = typeof window !== 'undefined'

function lsGet(key): string | null {
  return isClient ? localStorage.getItem(key) : null
}
function lsSet(key, value) {
  if (isClient) localStorage.setItem(key, value)
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function swMessage(payload: object) {
  if (!isClient || !('serviceWorker' in navigator)) return
  navigator.serviceWorker.ready.then((reg) => {
    reg.active?.postMessage(payload)
  })
}

function showLocalNotif(title, body, tag, url = '/tasks', delay = 0) {
  swMessage({ type: 'SHOW_NOTIFICATION', payload: { title, body, tag, url, delay } })
}

// ── Hook principal ────────────────────────────────────────────────────────────
export function useNotifications() {
  const tasks  = useStore((s) => s.tasks)
  const streak = useStore((s) => s.streak)
  const scheduledRef = useRef>(new Set())

  // ── Enregistrement du service worker ─────────────────────────────────────
  useEffect(() => {
    if (!isClient || !('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw-custom.js').catch(console.error)
  }, [])

  // ── Demande de permission ─────────────────────────────────────────────────
  const requestPermission = useCallback(async () => {
    if (!isClient || !('Notification' in window)) return 'denied'
    if (Notification.permission === 'granted') return 'granted'
    const result = await Notification.requestPermission()
    return result 
  }, [])

  const getPermission = useCallback((): NotifPermission => {
    if (!isClient || !('Notification' in window)) return 'denied'
    return Notification.permission 
  }, [])

  // ── Rappels de tâches (X minutes avant) ──────────────────────────────────
  const scheduleTaskReminders = useCallback(() => {
    if (getPermission() !== 'granted') return
    const minutesBefore = parseInt(lsGet(KEY_REMINDER_MINUTES) || '0', 10)
    if (!minutesBefore) return

    const now   = new Date()
    const today = tasks.filter((t) => isSameDay(new Date(t.scheduledAt), now) && !t.done)

    today.forEach((task) => {
      const scheduledAt = new Date(task.scheduledAt)
      const notifTime   = subMinutes(scheduledAt, minutesBefore)
      const delay       = notifTime.getTime() - now.getTime()
      const notifId     = `task-${task.id}-${minutesBefore}`

      if (delay <= 0 || scheduledRef.current.has(notifId)) return

      scheduledRef.current.add(notifId)
      showLocalNotif(
        `⏰ ${task.title}`,
        `Planifiée à ${format(scheduledAt, 'HH:mm', { locale: fr })} — dans ${minutesBefore} minutes`,
        notifId,
        '/tasks',
        delay,
      )
    })
  }, [tasks, getPermission])

  // ── Alerte streak (heure configurable, une fois par jour) ─────────────────
  const checkStreakAlert = useCallback(() => {
    if (getPermission() !== 'granted') return
    const streakAlert = lsGet(KEY_STREAK_ALERT) !== 'false'
    if (!streakAlert || streak === 0) return

    const alertHour = parseInt(lsGet(KEY_STREAK_HOUR) || '20', 10)
    const now       = new Date()
    const today     = now.toDateString()
    const lastNotif = lsGet(KEY_LAST_STREAK_NOTIF)

    if (lastNotif === today) return
    if (now.getHours() < alertHour) return

    const doneTodayCount = tasks.filter(
      (t) => t.done && t.doneAt && isSameDay(new Date(t.doneAt), now)
    ).length

    if (doneTodayCount > 0) return

    lsSet(KEY_LAST_STREAK_NOTIF, today)
    showLocalNotif(
      `🔥 Streak en danger ! ${streak} jours`,
      `Tu n' encore complété de tâche aujourd'hui. Ne brise pas ta série !`,
      'streak-alert',
      '/tasks',
      0,
    )
  }, [tasks, streak, getPermission])

  // ── Scheduler — vérifie toutes les minutes ────────────────────────────────
  useEffect(() => {
    scheduleTaskReminders()
    checkStreakAlert()

    const interval = setInterval(() => {
      scheduleTaskReminders()
      checkStreakAlert()
    }, 60_000)

    return () => clearInterval(interval)
  }, [scheduleTaskReminders, checkStreakAlert])

  // ── API exposée ───────────────────────────────────────────────────────────
  return {
    permission:         getPermission(),
    requestPermission,
    getReminderMinutes: () => parseInt(lsGet(KEY_REMINDER_MINUTES) || '0', 10),
    setReminderMinutes: (m) => lsSet(KEY_REMINDER_MINUTES, String(m)),
    getStreakAlert:     () => lsGet(KEY_STREAK_ALERT) !== 'false',
    setStreakAlert:     (v) => lsSet(KEY_STREAK_ALERT, String(v)),
    getStreakHour:      () => parseInt(lsGet(KEY_STREAK_HOUR) || '20', 10),
    setStreakHour:      (h) => lsSet(KEY_STREAK_HOUR, String(h)),
    testNotification:   () => showLocalNotif('🎯 FocusFlow', 'Les notifications sont bien configurées !', 'test'),
  }
}
