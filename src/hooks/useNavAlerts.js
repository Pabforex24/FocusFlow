import { useCallback, useEffect, useMemo, useState } from 'react'
import { useData } from '../contexts/DataContext.jsx'
import { buildNavAlerts, readAlertIds, saveAlertIds, unreadAlertCount } from '../lib/navAlerts.js'

const READ_EVENT = 'focusflow:nav-alerts-read'

export function useNavAlerts() {
  const { tasks, today, stats } = useData()
  const alerts = useMemo(() => buildNavAlerts({ tasks, today, stats }), [tasks, today, stats])
  const [readIds, setReadIds] = useState(readAlertIds)

  useEffect(() => {
    const sync = () => setReadIds(readAlertIds())
    window.addEventListener(READ_EVENT, sync)
    return () => window.removeEventListener(READ_EVENT, sync)
  }, [])

  const markRead = useCallback(() => {
    const next = [...new Set([...readIds, ...alerts.map((alert) => alert.id)])]
    saveAlertIds(next)
    setReadIds(next)
    window.dispatchEvent(new Event(READ_EVENT))
  }, [alerts, readIds])

  return { alerts, unread: unreadAlertCount(alerts, readIds), markRead }
}
