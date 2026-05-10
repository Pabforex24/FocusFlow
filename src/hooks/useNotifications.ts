'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useStore } from '@/store'
import { isSameDay, isAfter, subMinutes, format } from 'date-fns'
import { fr } from 'date-fns/locale'

// ── Types ────────────────────────────────────────────────────────────────────
export type NotifPermission = 'default' | 'granted' | 'denied'

// ── Clés localStorage ────────────────────────────────────────────────────────
const KEY_REMINDER_MINUTES = 'ff_reminder_minutes' // ex: "30"
const KEY_STREAK_ALERT     = 'ff_streak_alert'     // "true" | "false"
const KEY_STREAK_HOUR      = 'ff_streak_hour'      // "20" (heure de l'alerte)
const KEY_LAST_STREAK_NOTIF = 'ff_last_streak_notif' // date ISO

// ── Helpers ──────────────────────────────────────────────────────────────────
function swMessage(payload: object) {
  if (!('serviceWorker' in navigator)) return
  navigator.serviceWorker.ready.then((reg) => {
    reg.active?.postMessage(payload)
  })
}

function showLocalNotif(title: string, body: string, tag: string, url = '/tasks', delay = 0) {
  swMessage({ type: 'SHOW_NOTIFICATION', payload: { title, body, tag, url, delay } })
}

// ── Hook principal ────────────────────────────────────────────────────────────
export function useNotifications() {
  const tasks  = useStore((s) => s.tasks)
  const streak = useStore((s) => s.streak)
  const scheduledRef = useRef<Set<string>>(new Set())

  // ── Enregistrement du service worker ─────────────────────────────────────
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw-custom.js').catch(console.error)
  }, [])

  // ── Demande de permission ─────────────────────────────────────────────────
  const requestPermission = useCallback(async (): Promise<NotifPermission> => {
    if (!('Notification' in window)) return 'denied'
    if (Notification.permission === 'granted') return 'granted'
    const result = await Notification.requestPermission()
    return result as NotifPermission
  }, [])

  const getPermission = useCallback((): NotifPermission => {
    if (!('Notification' in window)) return 'denied'
    return Notification.permission as NotifPermission
  }, [])

  // ── Rappels de tâches (X minutes avant) ──────────────────────────────────
  const scheduleTaskReminders = useCallback(() => {
    if (getPermission() !== 'granted') return
    const minutesBefore = parseInt(localStorage.getItem(KEY_REMINDER_MINUTES) || '0', 10)
    if (!minutesBefore) return

    const now   = new Date()
    const today = tasks.filter((t) => isSameDay(new Date(t.scheduledAt), now) && !t.done)

    today.forEach((task) => {
      const scheduledAt  = new Date(task.scheduledAt)
      const notifTime    = subMinutes(scheduledAt, minutesBefore)
      const delay        = notifTime.getTime() - now.getTime()
      const notifId      = `task-${task.id}-${minutesBefore}`

      // Ne pas re-scheduler si déjà fait ou si le moment est passé
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
    const streakAlert = localStorage.getItem(KEY_STREAK_ALERT) !== 'false'
    if (!streakAlert || streak === 0) return

    const alertHour = parseInt(localStorage.getItem(KEY_STREAK_HOUR) || '20', 10)
    const now       = new Date()
    const today     = now.toDateString()
    const lastNotif = localStorage.getItem(KEY_LAST_STREAK_NOTIF)

    // Déjà notifié aujourd'hui
    if (lastNotif === today) return

    // Vérifier si l'heure d'alerte est passée
    if (now.getHours() < alertHour) return

    // Vérifier si l'utilisateur a déjà fait une tâche aujourd'hui
    const doneTodayCount = tasks.filter(
      (t) => t.done && t.doneAt && isSameDay(new Date(t.doneAt), now)
    ).length

    if (doneTodayCount > 0) return // Streak safe, pas d'alerte

    localStorage.setItem(KEY_LAST_STREAK_NOTIF, today)
    showLocalNotif(
      `🔥 Streak en danger ! ${streak} jours`,
      `Tu n'as pas encore complété de tâche aujourd'hui. Ne brise pas ta série !`,
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
    permission:           getPermission(),
    requestPermission,
    getReminderMinutes:   () => parseInt(localStorage.getItem(KEY_REMINDER_MINUTES) || '0', 10),
    setReminderMinutes:   (m: number) => localStorage.setItem(KEY_REMINDER_MINUTES, String(m)),
    getStreakAlert:       () => localStorage.getItem(KEY_STREAK_ALERT) !== 'false',
    setStreakAlert:       (v: boolean) => localStorage.setItem(KEY_STREAK_ALERT, String(v)),
    getStreakHour:        () => parseInt(localStorage.getItem(KEY_STREAK_HOUR) || '20', 10),
    setStreakHour:        (h: number) => localStorage.setItem(KEY_STREAK_HOUR, String(h)),
    testNotification:     () => showLocalNotif('🎯 FocusFlow', 'Les notifications sont bien configurées !', 'test'),
  }
}
