'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, X, Clock, Flame, CheckCircle2, AlertTriangle, BellOff } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { hexToRgba } from '@/lib/utils'
import { useStore } from '@/store'
import { isSameDay } from 'date-fns'

export function NotificationPanel() {
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)
  const notif    = useNotifications()
  const { tasks, streak } = useStore()
  const [permission, setPermission] = useState(notif.permission)
  const [reminderMin, setReminderMin] = useState(0)
  const [streakAlert, setStreakAlert] = useState(true)
  const [streakHour, setStreakHour]   = useState(20)
  const [testSent, setTestSent]       = useState(false)

  useEffect(() => {
    setReminderMin(notif.getReminderMinutes())
    setStreakAlert(notif.getStreakAlert())
    setStreakHour(notif.getStreakHour())
  }, [open])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target )) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Today's tasks for preview
  const today      = new Date()
  const todayTasks = tasks.filter((t) => isSameDay(new Date(t.scheduledAt), today) && !t.done)
  const doneTodayCount = tasks.filter((t) => t.done && t.doneAt && isSameDay(new Date(t.doneAt), today)).length
  const streakSafe = doneTodayCount > 0

  const handleRequestPermission = async () => {
    const result = await notif.requestPermission()
    setPermission(result)
  }

  const handleTest = () => {
    notif.testNotification()
    setTestSent(true)
    setTimeout(() => setTestSent(false), 2500)
  }

  const isGranted = permission === 'granted'
  const isDenied  = permission === 'denied'

  return (
    <div ref={panelRef} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative w-8 h-8 rounded-xl flex items-center justify-center transition-all"
        style={{
          background: open ? 'rgba(0,229,176,0.12)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${open ? 'rgba(0,229,176,0.25)' : 'rgba(255,255,255,0.07)'}`,
        }}
      >
        <Bell size={15} strokeWidth={1.75} style={{ color: open ? '#00E5B0' : '#7A8BAD' }} />
        {/* Badge si streak en danger */}
        {isGranted && streakAlert && !streakSafe && streak > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-bg"
            style={{ background: '#FF5E7A' }}
          />
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="absolute right-0 top-10 w-80 rounded-2xl z-50 overflow-hidden"
          style={{
            background: 'rgba(9,13,26,0.98)',
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.70)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-2">
              <Bell size={14} style={{ color: '#00E5B0' }} />
              <span className="text-sm font-bold text-content">Notifications</span>
            </div>
            <button onClick={() => setOpen(false)}>
              <X size={14} style={{ color: '#3D4F6E' }} />
            </button>
          </div>

          <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto overscroll-contain">

            {/* Permission banner */}
            {!isGranted && (
              <div className="rounded-xl p-3" style={{ background: 'rgba(123,94,167,0.10)', border: '1px solid rgba(123,94,167,0.20)' }}>
                <div className="flex items-start gap-2.5">
                  {isDenied ? <BellOff size={14} style={{ color: '#FF5E7A' }} className="flex-shrink-0 mt-0.5" />
                             : <Bell size={14} style={{ color: '#7B5EA7' }} className="flex-shrink-0 mt-0.5" />}
                  <div>
                    <p className="text-xs font-semibold text-content mb-0.5">
                      {isDenied ? 'Notifications bloquées' : 'Activer les notifications'}
                    </p>
                    <p className="text-[10px]" style={{ color: '#3D4F6E' }}>
                      {isDenied
                        ? 'Autorise-les dans les réglages de ton navigateur.'
                        : 'Rappels de tâches et alertes streak.'}
                    </p>
                    {!isDenied && (
                      <button onClick={handleRequestPermission}
                        className="mt-2 text-[10px] font-bold px-2.5 py-1 rounded-lg"
                        style={{ background: 'rgba(123,94,167,0.20)', color: '#7B5EA7', border: '1px solid rgba(123,94,167,0.35)' }}>
                        Activer →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Streak status */}
            <div className="rounded-xl p-3" style={{
              background: streakSafe ? 'rgba(0,229,176,0.06)' : 'rgba(255,94,122,0.06)',
              border: `1px solid ${streakSafe ? 'rgba(0,229,176,0.14)' : 'rgba(255,94,122,0.14)'}`,
            }}>
              <div className="flex items-center gap-2.5">
                <Flame size={16} style={{ color: streakSafe ? '#00E5B0' : '#FF5E7A' }} />
                <div>
                  <p className="text-xs font-semibold" style={{ color: streakSafe ? '#00E5B0' : '#FF5E7A' }}>
                    {streakSafe ? `Streak sécurisé 🔥 ${streak}j` : `Streak en danger ! ${streak}j`}
                  </p>
                  <p className="text-[10px]" style={{ color: '#3D4F6E' }}>
                    {streakSafe ? `${doneTodayCount} tâche(s) faite(s) aujourd'hui` : 'Aucune tâche complétée aujourd\'hui'}
                  </p>
                </div>
              </div>
            </div>

            {/* Tâches du jour */}
            {todayTasks.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#3D4F6E' }}>
                  À faire aujourd'hui
                </p>
                <div className="space-y-1.5">
                  {todayTasks.slice(0, 4).map((task) => (
                    <div key={task.id} className="flex items-center gap-2.5 rounded-lg px-3 py-2"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <CheckCircle2 size={12} style={{ color: '#3D4F6E' }} className="flex-shrink-0" />
                      <span className="text-xs text-content truncate flex-1">{task.title}</span>
                      {task.duration && (
                        <span className="text-[9px] flex-shrink-0" style={{ color: '#3D4F6E' }}>{task.duration}</span>
                      )}
                    </div>
                  ))}
                  {todayTasks.length > 4 && (
                    <p className="text-[10px] text-center" style={{ color: '#1E2A40' }}>
                      +{todayTasks.length - 4} autres tâches
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Paramètres notifications */}
            {isGranted && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#3D4F6E' }}>
                  Paramètres
                </p>

                {/* Rappel tâches */}
                <div className="mb-3">
                  <p className="text-[10px] font-semibold text-content mb-1.5 flex items-center gap-1.5">
                    <Clock size={10} /> Rappel avant les tâches
                  </p>
                  <div className="flex gap-1.5 flex-wrap">
                    {[0, 5, 15, 30, 60].map((m) => (
                      <button key={m}
                        onClick={() => { setReminderMin(m); notif.setReminderMinutes(m) }}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
                        style={{
                          background: reminderMin === m ? 'rgba(61,216,250,0.15)' : 'rgba(255,255,255,0.04)',
                          color:      reminderMin === m ? '#3DD8FA' : '#3D4F6E',
                          border:     `1px solid ${reminderMin === m ? 'rgba(61,216,250,0.30)' : 'rgba(255,255,255,0.06)'}`,
                        }}>
                        {m === 0 ? 'Off' : `${m}m`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Alerte streak */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[10px] font-semibold text-content flex items-center gap-1.5">
                      <Flame size={10} /> Alerte streak
                    </p>
                    <button
                      onClick={() => { const v = !streakAlert; setStreakAlert(v); notif.setStreakAlert(v) }}
                      className="relative w-8 h-4 rounded-full transition-all"
                      style={{ background: streakAlert ? 'rgba(200,134,90,0.50)' : 'rgba(255,255,255,0.10)' }}>
                      <div className="absolute top-0.5 w-3 h-3 rounded-full transition-all"
                        style={{ left: streakAlert ? '17px' : '2px', background: streakAlert ? '#C8865A' : '#3D4F6E' }} />
                    </button>
                  </div>
                  {streakAlert && (
                    <div className="flex gap-1.5 flex-wrap">
                      {[18, 19, 20, 21, 22].map((h) => (
                        <button key={h}
                          onClick={() => { setStreakHour(h); notif.setStreakHour(h) }}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold transition-all"
                          style={{
                            background: streakHour === h ? 'rgba(200,134,90,0.15)' : 'rgba(255,255,255,0.04)',
                            color:      streakHour === h ? '#C8865A' : '#3D4F6E',
                            border:     `1px solid ${streakHour === h ? 'rgba(200,134,90,0.30)' : 'rgba(255,255,255,0.06)'}`,
                          }}>
                          {h}h
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Test */}
                <button onClick={handleTest} disabled={testSent}
                  className="w-full text-[10px] font-bold py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5"
                  style={{
                    background: testSent ? 'rgba(0,229,176,0.10)' : 'rgba(255,255,255,0.04)',
                    color:      testSent ? '#00E5B0' : '#7A8BAD',
                    border:     `1px solid ${testSent ? 'rgba(0,229,176,0.20)' : 'rgba(255,255,255,0.06)'}`,
                  }}>
                  {testSent ? <><CheckCircle2 size={10} /> Envoyée !</> : <><Bell size={10} /> Tester</>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
