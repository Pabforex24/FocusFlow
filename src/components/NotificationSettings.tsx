'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, Flame, Clock, CheckCircle2, AlertTriangle } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { hexToRgba } from '@/lib/utils'

export function NotificationSettings() {
  const notif = useNotifications()
  const [permission, setPermission]     = useState(notif.permission)
  const [reminderMin, setReminderMin]   = useState(0)
  const [streakAlert, setStreakAlert]   = useState(true)
  const [streakHour, setStreakHour]     = useState(20)
  const [testSent, setTestSent]         = useState(false)

  useEffect(() => {
    setReminderMin(notif.getReminderMinutes())
    setStreakAlert(notif.getStreakAlert())
    setStreakHour(notif.getStreakHour())
  }, [])

  const handleRequestPermission = async () => {
    const result = await notif.requestPermission()
    setPermission(result)
  }

  const handleReminderChange = (m: number) => {
    setReminderMin(m)
    notif.setReminderMinutes(m)
  }

  const handleStreakAlertChange = (v: boolean) => {
    setStreakAlert(v)
    notif.setStreakAlert(v)
  }

  const handleStreakHourChange = (h: number) => {
    setStreakHour(h)
    notif.setStreakHour(h)
  }

  const handleTest = () => {
    notif.testNotification()
    setTestSent(true)
    setTimeout(() => setTestSent(false), 3000)
  }

  const isGranted = permission === 'granted'
  const isDenied  = permission === 'denied'

  return (
    <div
      className="rounded-2xl p-5 space-y-5"
      style={{
        background: 'linear-gradient(145deg, rgba(14,18,36,0.90) 0%, rgba(9,13,26,0.95) 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: hexToRgba('#7B5EA7', 0.15), color: '#7B5EA7' }}
          >
            <Bell size={15} />
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm text-content">Notifications</h3>
            <p className="text-[10px]" style={{ color: '#3D4F6E' }}>Rappels et alertes streak</p>
          </div>
        </div>

        {/* Statut permission */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
          style={{
            background: isGranted ? 'rgba(0,229,176,0.12)' : isDenied ? 'rgba(255,94,122,0.12)' : 'rgba(200,134,90,0.12)',
            color:      isGranted ? '#00E5B0' : isDenied ? '#FF5E7A' : '#C8865A',
            border:     `1px solid ${isGranted ? 'rgba(0,229,176,0.25)' : isDenied ? 'rgba(255,94,122,0.25)' : 'rgba(200,134,90,0.25)'}`,
          }}
        >
          {isGranted ? <CheckCircle2 size={9} /> : isDenied ? <BellOff size={9} /> : <AlertTriangle size={9} />}
          {isGranted ? 'Autorisé' : isDenied ? 'Refusé' : 'Non configuré'}
        </div>
      </div>

      {/* Demande de permission */}
      {!isGranted && (
        <div
          className="rounded-xl p-3.5 flex items-start gap-3"
          style={{ background: 'rgba(123,94,167,0.08)', border: '1px solid rgba(123,94,167,0.20)' }}
        >
          <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#C8865A' }} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-content mb-1">
              {isDenied
                ? 'Notifications bloquées dans le navigateur'
                : 'Active les notifications pour ne rien manquer'}
            </p>
            <p className="text-[10px] mb-3" style={{ color: '#3D4F6E' }}>
              {isDenied
                ? 'Va dans les paramètres de ton navigateur → Site → Notifications → Autoriser.'
                : 'Rappels avant tes tâches, alertes streak, récaps quotidiens.'}
            </p>
            {!isDenied && (
              <button
                onClick={handleRequestPermission}
                className="text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                style={{ background: 'rgba(123,94,167,0.20)', color: '#7B5EA7', border: '1px solid rgba(123,94,167,0.35)' }}
              >
                Activer les notifications
              </button>
            )}
          </div>
        </div>
      )}

      {/* Settings — visibles seulement si permission accordée */}
      {isGranted && (
        <div className="space-y-4">

          {/* Rappel avant tâche */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock size={12} style={{ color: '#3DD8FA' }} />
              <span className="text-xs font-semibold text-content">Rappel avant les tâches</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[0, 5, 15, 30, 60].map((m) => (
                <button
                  key={m}
                  onClick={() => handleReminderChange(m)}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                  style={{
                    background: reminderMin === m ? 'rgba(61,216,250,0.15)' : 'rgba(255,255,255,0.04)',
                    color:      reminderMin === m ? '#3DD8FA' : '#3D4F6E',
                    border:     `1px solid ${reminderMin === m ? 'rgba(61,216,250,0.30)' : 'rgba(255,255,255,0.06)'}`,
                  }}
                >
                  {m === 0 ? 'Désactivé' : `${m} min`}
                </button>
              ))}
            </div>
          </div>

          {/* Alerte streak */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Flame size={12} style={{ color: '#C8865A' }} />
                <span className="text-xs font-semibold text-content">Alerte streak</span>
              </div>
              {/* Toggle */}
              <button
                onClick={() => handleStreakAlertChange(!streakAlert)}
                className="relative w-10 h-5 rounded-full transition-all"
                style={{ background: streakAlert ? 'rgba(200,134,90,0.50)' : 'rgba(255,255,255,0.10)' }}
              >
                <div
                  className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
                  style={{
                    left: streakAlert ? '22px' : '2px',
                    background: streakAlert ? '#C8865A' : '#3D4F6E',
                    boxShadow: streakAlert ? '0 0 6px rgba(200,134,90,0.60)' : 'none',
                  }}
                />
              </button>
            </div>

            {streakAlert && (
              <div>
                <p className="text-[10px] mb-2" style={{ color: '#3D4F6E' }}>
                  Alerte si aucune tâche complétée avant :
                </p>
                <div className="flex gap-2 flex-wrap">
                  {[18, 19, 20, 21, 22].map((h) => (
                    <button
                      key={h}
                      onClick={() => handleStreakHourChange(h)}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                      style={{
                        background: streakHour === h ? 'rgba(200,134,90,0.15)' : 'rgba(255,255,255,0.04)',
                        color:      streakHour === h ? '#C8865A' : '#3D4F6E',
                        border:     `1px solid ${streakHour === h ? 'rgba(200,134,90,0.30)' : 'rgba(255,255,255,0.06)'}`,
                      }}
                    >
                      {h}h00
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bouton test */}
          <div className="pt-1 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <button
              onClick={handleTest}
              disabled={testSent}
              className="text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all hover:opacity-80 flex items-center gap-1.5"
              style={{
                background: testSent ? 'rgba(0,229,176,0.12)' : 'rgba(255,255,255,0.05)',
                color:      testSent ? '#00E5B0' : '#7A8BAD',
                border:     `1px solid ${testSent ? 'rgba(0,229,176,0.25)' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              {testSent ? <CheckCircle2 size={11} /> : <Bell size={11} />}
              {testSent ? 'Notification envoyée !' : 'Tester une notification'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
