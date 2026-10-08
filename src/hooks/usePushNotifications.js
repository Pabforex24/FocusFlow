// Active/désactive les rappels push depuis le Profil. Toute la logique navigateur
// (permission, abonnement, désabonnement) est isolée ici ; l'état vit dans le profil.

import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useData } from '../contexts/DataContext.jsx'
import { useToast } from '../contexts/ToastContext.jsx'
import { toUserMessage } from '../lib/errors.js'
import { DEFAULT_REMIND_HOUR, isPushSupported, needsIosInstallHint, urlBase64ToUint8Array } from '../lib/push.js'
import { removePushSubscription, savePushSubscription } from '../services/api.js'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

export function usePushNotifications() {
  const { user } = useAuth()
  const { profile, actions } = useData()
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const [denied, setDenied] = useState(() => typeof Notification !== 'undefined' && Notification.permission === 'denied')

  const enabled = profile?.remind_enabled ?? false
  const hour = profile?.remind_hour ?? DEFAULT_REMIND_HOUR

  const subscribe = async () => {
    // Le service worker n'est actif qu'en production (voir lib/pwa.js) : hors build, on explique.
    if (!import.meta.env.PROD) {
      toast.error("Les notifications s'activent sur la version déployée de l'application.")
      return
    }
    if (!isPushSupported()) {
      toast.error('Ce navigateur ne prend pas en charge les notifications.')
      return
    }
    if (!VAPID_PUBLIC_KEY) {
      toast.error('Notifications non configurées (clé VAPID manquante).')
      return
    }

    const permission = await Notification.requestPermission()
    setDenied(permission === 'denied')
    if (permission !== 'granted') {
      toast.error(permission === 'denied' ? 'Notifications bloquées dans les réglages du navigateur.' : 'Notifications refusées.')
      return
    }

    const registration = await navigator.serviceWorker.register('/sw.js')
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })
    try {
      await savePushSubscription(user.id, subscription)
      const ok = await actions.setRemindSettings({
        remind_enabled: true,
        remind_hour: hour,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      })
      if (!ok) await subscription.unsubscribe().catch(() => {})
    } catch (error) {
      await subscription.unsubscribe().catch(() => {}) // pas d'abonnement orphelin en cas d'échec
      throw error
    }
  }

  const unsubscribe = async () => {
    const registration = await navigator.serviceWorker.getRegistration()
    const subscription = await registration?.pushManager.getSubscription()
    if (subscription) {
      await removePushSubscription(subscription.endpoint).catch(() => {}) // le nettoyage local prime
      await subscription.unsubscribe().catch(() => {})
    }
    await actions.setRemindSettings({ remind_enabled: false })
  }

  const toggle = async (next) => {
    if (busy || !user) return
    setBusy(true)
    try {
      if (next) await subscribe()
      else await unsubscribe()
    } catch (error) {
      toast.error(toUserMessage(error))
    } finally {
      setBusy(false)
    }
  }

  const setHour = (value) => actions.setRemindSettings({ remind_hour: Number(value) })

  return {
    supported: isPushSupported(),
    iosHint: needsIosInstallHint(),
    denied,
    enabled,
    hour,
    busy,
    toggle,
    setHour,
  }
}
