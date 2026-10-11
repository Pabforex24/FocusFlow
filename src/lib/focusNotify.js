// Notifications système liées à une session Focus (best-effort PWA).
// Tant que la session tourne, une notification persistante affiche le temps restant ; elle est
// mise à jour chaque minute et remplacée par une notification de fin (son + vibration) au terme.
// Limite PWA : si l'app est totalement fermée, le minuteur JS ne tourne plus ; la notification
// « en cours » reste alors affichée mais la notification de fin n'arrive qu'au retour dans l'app.
// Toutes les fonctions sont silencieuses (aucune erreur remontée) : les notifications sont un bonus.

const TAG = 'focus-session'

function canNotify() {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    Notification.permission === 'granted'
  )
}

async function getRegistration() {
  if (!canNotify()) return null
  try {
    return (await navigator.serviceWorker.getRegistration()) ?? null
  } catch {
    return null
  }
}

function endTime(endsAt) {
  return new Date(endsAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

// Demande la permission si nécessaire. À appeler depuis un geste utilisateur (clic « Démarrer »).
export async function requestFocusPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  try {
    return (await Notification.requestPermission()) === 'granted'
  } catch {
    return false
  }
}

export async function showFocusStart(session) {
  const registration = await getRegistration()
  if (!registration) return
  const task = session.taskTitle || 'Session Focus'
  try {
    await registration.showNotification('Session Focus en cours', {
      body: `${task} · ${session.minutes} min · fin à ${endTime(session.endsAt)}`,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: TAG,
      renotify: false,
      requireInteraction: true, // reste affichée jusqu'à la fin de la session
      silent: true,
      data: { url: '/tasks' },
    })
  } catch {
    // iOS non installée, permission retirée entre-temps, etc. : on ignore.
  }
}

export async function updateFocusNotification(session, remainingMs) {
  const registration = await getRegistration()
  if (!registration) return
  const minutes = Math.max(0, Math.ceil(remainingMs / 60_000))
  const task = session.taskTitle || 'Session Focus'
  try {
    await registration.showNotification(`${minutes} min restantes`, {
      body: `${task} · fin à ${endTime(session.endsAt)}`,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: TAG,
      renotify: false,
      requireInteraction: true,
      silent: true,
      data: { url: '/tasks' },
    })
  } catch {
    // ignoré
  }
}

export async function showFocusDone(session) {
  const registration = await getRegistration()
  if (!registration) return
  const body = session.taskTitle ? `« ${session.taskTitle} » terminée. +30 XP. Bien joué !` : 'Session terminée. +30 XP. Bien joué !'
  try {
    await registration.showNotification('Session Focus terminée', {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: TAG,
      renotify: true, // remplace la notification « en cours » en alertant
      requireInteraction: false,
      silent: false,
      vibrate: [200, 100, 200],
      data: { url: '/tasks' },
    })
  } catch {
    // ignoré
  }
}

export async function closeFocusNotification() {
  const registration = await getRegistration()
  if (!registration?.getNotifications) return
  try {
    const list = await registration.getNotifications({ tag: TAG })
    list.forEach((n) => n.close())
  } catch {
    // ignoré
  }
}

// Diagnostic : vérifie que la permission + le service worker fonctionnent sur cet appareil.
export async function showTestNotification() {
  const granted = await requestFocusPermission()
  if (!granted) return false
  const registration = await getRegistration()
  if (!registration) return false
  try {
    await registration.showNotification('Notifications activées', {
      body: 'Cet appareil affiche bien les notifications de FocusFlow.',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: 'focusflow-test',
      data: { url: '/' },
    })
    return true
  } catch {
    return false
  }
}
