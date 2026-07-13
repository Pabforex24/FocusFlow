'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/store'
import { useAllDomainProgress } from '@/store/selectors'
import { RingProgress, ProgressBar } from '@/components/ui/ProgressBar'
import { DomainIcon } from '@/components/domain/DomainIcon'
import { hexToRgba } from '@/lib/utils'
import {
  X, Flame, Zap, CheckCircle2, XCircle, Star,
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

function getTodayKey() {
  return `focusflow-recap-${new Date().toISOString().split('T')[0]}`
}
function hasShownToday() {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(getTodayKey()) === '1'
}
function markShownToday() {
  if (typeof window === 'undefined') return
  localStorage.setItem(getTodayKey(), '1')
}

function RecapStat({ icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl"
      style={{ background: hexToRgba(color, 0.08), border: `1px solid ${hexToRgba(color, 0.18)}` }}>
      <div style={{ color }}>{icon}</div>
      <span className="font-heading font-extrabold text-xl leading-none" style={{ color }}>{value}</span>
      <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: '#3D4F6E' }}>{label}</span>
    </div>
  )
}

export function DailyRecap() {
  const [open, setOpen] = useState(false)

  const tasks                = useStore((s) => s.tasks)
  const domains              = useStore((s) => s.domains)
  const userStats            = useStore((s) => s.userStats)
  const streak               = useStore((s) => s.streak)
  const activeChallenges     = useStore((s) => s.activeChallenges)
  const getChallengeProgress = useStore((s) => s.getChallengeProgress)
  const getEffectiveChallenge = useStore((s) => s.getEffectiveChallenge)
  const domainProgress = useAllDomainProgress()

  useEffect(() => {
    const check = () => {
      const h = new Date().getHours()
      const todayStr   = new Date().toDateString()
      const todayTasks = tasks.filter((t) => new Date(t.scheduledAt).toDateString() === todayStr)
      if (h >= 21 && todayTasks.length > 0 && !hasShownToday()) {
        setOpen(true)
        markShownToday()
      }
    }
    check()
    const interval = setInterval(check, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [tasks])

  if (!open) return null

  const todayStr   = new Date().toDateString()
  const todayTasks = tasks.filter((t) => new Date(t.scheduledAt).toDateString() === todayStr)
  const doneTasks  = todayTasks.filter((t) => t.done)
  const todayPct   = todayTasks.length ? Math.round((doneTasks.length / todayTasks.length) * 100) : 0
  const xpGained   = doneTasks.reduce((s, t) => s + (t.xpValue ?? 10), 0) + (todayPct === 100 ? 50 : 0)
  const isPerfect  = todayPct === 100

  const runningChallenges = activeChallenges
    .filter((ac) => ac.isActive)
    .map((ac) => {
      const challenge = getEffectiveChallenge(ac.challengeId)
      if (!challenge) return null
      const progress = getChallengeProgress(ac.id)
      const daysLeft = Math.max(0, Math.ceil((new Date(ac.endDate).getTime() - Date.now()) / 86400000))
      return { ac, challenge, progress, daysLeft }
    })
    .filter(Boolean) []

  const msg = isPerfect
    ? { emoji: '🏆', text: 'Journée parfaite ! Toutes tes tâches sont complétées.' }
    : todayPct >= 75 ? { emoji: '💪', text: 'Très bonne journée ! Continue sur cette lancée.' }
    : todayPct >= 50 ? { emoji: '👍', text: 'Bonne journée. Demain, tu feras encore mieux.' }
    : todayPct > 0   ? { emoji: '🌱', text: 'Tu . Chaque tâche compte.' }
    : { emoji: '🌙',  text: "Planifie tes tâches pour demain dès maintenant !" }

  const accentColor = isPerfect ? '#00E5B0' : '#7B5EA7'

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/75 backdrop-blur-md animate-fade-in" onClick={() => setOpen(false)} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div
          className="relative w-full max-w-md my-8 animate-scale-in"
          style={{
            background: 'linear-gradient(145deg, rgba(14,18,36,0.97) 0%, rgba(9,13,26,0.99) 100%)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '24px',
            boxShadow: '0 32px 80px rgba(0,0,0,0.75)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Accent line */}
          <div className="h-px w-full rounded-t-[24px]"
            style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }} />

          <button onClick={() => setOpen(false)}
            className="absolute top-4 right-4 w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ color: '#3D4F6E', background: 'rgba(255,255,255,0.04)' }}>
            <X size={15} />
          </button>

          <div className="px-6 py-6">
            {/* Header */}
            <div className="text-center mb-6">
              <p className="text-4xl mb-2">{msg.emoji}</p>
              <h2 className="font-heading font-extrabold text-xl text-content mb-1">
                Récapitulatif — <span className="capitalize">{format(new Date(), 'd MMMM', { locale: fr })}</span>
              </h2>
              <p className="text-sm" style={{ color: '#7A8BAD' }}>{msg.text}</p>
            </div>

            {/* Barre du jour */}
            <div className="rounded-2xl p-4 mb-5"
              style={{ background: hexToRgba(accentColor, 0.07), border: `1px solid ${hexToRgba(accentColor, 0.18)}` }}>
              <div className="flex items-end justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#3D4F6E' }}>Tâches du jour</span>
                <span className="font-heading font-extrabold text-2xl leading-none" style={{ color: accentColor }}>
                  {doneTasks.length}/{todayTasks.length}
                </span>
              </div>
              <ProgressBar value={todayPct} color={accentColor} height="lg" />
              {isPerfect && (
                <p className="text-xs font-semibold mt-2 text-center" style={{ color: '#00E5B0' }}>
                  ✨ Bonus perfectionniste +50 XP !
                </p>
              )}
            </div>

            {/* Stats 4 cases */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <RecapStat icon={<CheckCircle2 size={18} />} label="Complétées" value={doneTasks.length} color="#00E5B0" />
              <RecapStat icon={<Zap size={18} />}          label="XP gagnés"  value={`+${xpGained}`}   color="#7B5EA7" />
              <RecapStat icon={<Flame size={18} />}        label="Streak"     value={`${streak}j`}     color="#C8865A" />
              <RecapStat icon={<Star size={18} />}         label="Niveau"     value={userStats.level}  color="#3DD8FA" />
            </div>

            {/* Tâches non faites */}
            {todayTasks.filter((t) => !t.done).length > 0 && (
              <div className="mb-5">
                <p className="text-[11px] uppercase tracking-widest font-bold mb-2" style={{ color: '#3D4F6E' }}>
                  Non complétées
                </p>
                <div className="space-y-1.5">
                  {todayTasks.filter((t) => !t.done).slice(0, 4).map((t) => (
                    <div key={t.id} className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl"
                      style={{ background: 'rgba(255,94,122,0.06)', border: '1px solid rgba(255,94,122,0.14)' }}>
                      <XCircle size={12} style={{ color: '#FF5E7A', flexShrink: 0 }} />
                      <span className="truncate" style={{ color: '#7A8BAD' }}>{t.title}</span>
                    </div>
                  ))}
                  {todayTasks.filter((t) => !t.done).length > 4 && (
                    <p className="text-[11px] pl-1" style={{ color: '#3D4F6E' }}>
                      +{todayTasks.filter((t) => !t.done).length - 4} autres
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Challenges actifs */}
            {runningChallenges.length > 0 && (
              <div className="mb-5">
                <p className="text-[11px] uppercase tracking-widest font-bold mb-2" style={{ color: '#3D4F6E' }}>
                  Challenges en cours
                </p>
                <div className="space-y-2">
                  {runningChallenges.map(({ ac, challenge, progress, daysLeft }: any) => (
                    <div key={ac.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                      style={{ background: hexToRgba(challenge.color, 0.07), border: `1px solid ${hexToRgba(challenge.color, 0.18)}` }}>
                      <RingProgress value={progress} size={36} strokeWidth={3} color={challenge.color}>
                        <span className="text-[8px] font-bold" style={{ color: challenge.color }}>{progress}%</span>
                      </RingProgress>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-content truncate">{challenge.title}</p>
                        <p className="text-[10px]" style={{ color: '#3D4F6E' }}>
                          {daysLeft === 0 ? '🏁 Dernier jour !' : `⏳ ${daysLeft}j restant${daysLeft > 1 ? 's' : ''}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Domaines */}
            {domains.length > 0 && (
              <div className="mb-6">
                <p className="text-[11px] uppercase tracking-widest font-bold mb-2" style={{ color: '#3D4F6E' }}>Domaines</p>
                <div className="space-y-2">
                  {domains.map((d) => {
                    const pct = domainProgress[d.id] ?? 0
                    return (
                      <div key={d.id} className="flex items-center gap-2">
                        <DomainIcon name={d.icon} size={12} color={d.color} />
                        <span className="text-xs font-medium text-content w-20 truncate">{d.name}</span>
                        <ProgressBar value={pct} color={d.color} height="sm" className="flex-1" />
                        <span className="text-[11px] font-bold w-8 text-right" style={{ color: d.color }}>{pct}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* CTA */}
            <button
              onClick={() => setOpen(false)}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all"
              style={{
                background: isPerfect
                  ? 'linear-gradient(135deg, #00E5B0, #3DD8FA)'
                  : 'linear-gradient(135deg, #7B5EA7, #C8865A)',
                color: isPerfect ? '#050812' : '#fff',
                boxShadow: `0 0 24px ${hexToRgba(accentColor, 0.30)}`,
              }}
            >
              {isPerfect ? '🏆 Parfait, bonne nuit !' : '💪 Bonne nuit !'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
