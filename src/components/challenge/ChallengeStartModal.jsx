'use client'

import { useState, useMemo } from 'react'
import { useStore } from '@/store'
import { Modal } from '@/components/ui/Modal'
import { DomainIcon } from '@/components/domain/DomainIcon'
import { hexToRgba, cn } from '@/lib/utils'
import { Zap, Calendar, Target, Check, AlertCircle } from 'lucide-react'
import { addDays, format, differenceInDays } from 'date-fns'
import { fr } from 'date-fns/locale'


const FREQ_LABEL = {
  daily: 'Chaque jour', workdays: 'Jours ouvrables', weekend: 'Week-end', custom: 'Personnalisé',
}

export function ChallengeStartModal({ challenge, onClose }: ChallengeStartModalProps) {
  const { goals, domains, startChallenge } = useStore()

  const [bpGoalMap, setBpGoalMap] = useState>({})
  const [started,   setStarted]   = useState(false)

  // ⚠️ Tous les hooks AVANT le return conditionnel
  const startDate = useMemo(() => new Date(), [])

  const endDate = useMemo(() => {
    if (!challenge) return new Date()
    return challenge.deadline
      ? new Date(challenge.deadline)
      : addDays(startDate, challenge.durationDays)
  }, [challenge, startDate])

  const totalDays = useMemo(
    () => Math.max(1, differenceInDays(endDate, startDate)),
    [startDate, endDate]
  )

  const totalOccurrences = useMemo(() => {
    if (!challenge) return 0
    return challenge.blueprints.reduce((sum, bp) => {
      const freq  = bp.frequency || 'daily'
      const dates = getOccurrenceDates(startDate, endDate, freq, bp.customDays)
      return sum + dates.length
    }, 0)
  }, [challenge, startDate, endDate])

  // Garde conditionnelle APRÈS tous les hooks
  if (!challenge) return null

  const handleStart = () => {
    startChallenge(challenge.id, bpGoalMap)
    setStarted(true)
    setTimeout(onClose, 1400)
  }

  const goalsForBp = (bp: typeof challenge.blueprints[0]) =>
    goals.filter((g) => !bp.domainId || g.domainId === bp.domainId)

  return (
    <Modal open onClose={onClose} title="Lancer le challenge">
      {started ? (
        <div className="text-center py-10">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4"
            style={{ background: hexToRgba(challenge.color, 0.2) }}>
            <Zap size={32} style={{ color: challenge.color }} fill="currentColor" />
          </div>
          <p className="font-heading font-bold text-lg text-content">Challenge lancé !</p>
          <p className="text-sm text-content-3 mt-1">
            {totalOccurrences} tâches générées jusqu'au {format(endDate, 'd MMM yyyy', { locale: fr })} 🚀
          </p>
        </div>
      ) : (
        <div className="space-y-5 overflow-y-auto max-h-[80vh]">

          {/* Résumé challenge */}
          <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-bg-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: hexToRgba(challenge.color, 0.2) }}>
              <DomainIcon name={challenge.icon} size={20} color={challenge.color} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-heading font-bold text-sm text-content">{challenge.title}</p>
              <p className="text-xs text-content-3 truncate">{challenge.description}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-heading font-bold text-sm" style={{ color: challenge.color }}>{totalDays}j</p>
              <p className="text-[10px] text-content-3">{totalOccurrences} tâches</p>
            </div>
          </div>

          {/* Dates */}
          <div className="flex items-center gap-2 text-sm text-content-2">
            <Calendar size={14} className="text-content-3 flex-shrink-0" />
            <span>
              Du <strong>{format(startDate, 'd MMM', { locale: fr })}</strong>{' '}
              au <strong>{format(endDate, 'd MMM yyyy', { locale: fr })}</strong>
            </span>
          </div>

          {/* Association Tâche → Objectif */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-content-3 mb-3 flex items-center gap-1.5">
              <Target size={11} /> Associer chaque tâche à un objectif
            </p>

            <div className="space-y-3">
              {challenge.blueprints.map((bp) => {
                const domain       = domains.find((d) => d.id === bp.domainId)
                const availGoals   = goalsForBp(bp)
                const selectedGoal = goals.find((g) => g.id === bpGoalMap[bp.id])
                const freq         = bp.frequency || 'daily'
                const occCount     = getOccurrenceDates(startDate, endDate, freq, bp.customDays).length

                return (
                  <div key={bp.id}
                    className="bg-bg-3 border rounded-xl p-3 space-y-2.5"
                    style={{ borderColor: selectedGoal ? (domain?.color || '#7B61FF') + '50' : 'var(--border)' }}>

                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: challenge.color }} />
                      <span className="flex-1 text-sm font-semibold text-content">{bp.title}</span>
                      {bp.duration && (
                        <span className="text-xs text-content-3 font-medium">{bp.duration}</span>
                      )}
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                        style={{ background: hexToRgba(challenge.color, 0.12), color: challenge.color }}>
                        {FREQ_LABEL[freq]} · {occCount}×
                      </span>
                    </div>

                    <div>
                      {availGoals.length === 0 ? (
                        <div className="flex items-center gap-1.5 text-[11px] text-warning bg-warning/10 rounded-lg px-3 py-2">
                          <AlertCircle size={11} />
                          Aucun objectif dans {domain ? `le domaine "${domain.name}"` : 'vos domaines'}.
                          Créez-en un dans la page Objectifs.
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {availGoals.map((g) => {
                            const active = bpGoalMap[bp.id] === g.id
                            return (
                              <button key={g.id} type="button"
                                onClick={() => setBpGoalMap((m) => ({ ...m, [bp.id]: active ? '' : g.id }))}
                                className={cn(
                                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all',
                                  active
                                    ? 'text-white border-transparent'
                                    : 'bg-bg-4 border-border text-content-2 hover:border-border-2'
                                )}
                                style={active ? { background: domain?.color || challenge.color } : {}}
                              >
                                {active && <Check size={10} />}
                                {g.title}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <p className="text-[11px] text-content-3 mt-2 text-center">
              L'association est optionnelle — vous pouvez lancer sans sélectionner d'objectif.
            </p>
          </div>

          {/* CTA */}
          <div className="flex gap-2 pt-1">
            <button onClick={onClose}
              className="flex-1 flex items-center justify-center px-3 py-2.5 rounded-xl text-sm font-medium border border-border text-content-3 hover:text-content transition-all">
              Annuler
            </button>
            <button onClick={handleStart}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-bold border transition-all duration-200"
              style={{
                background: hexToRgba(challenge.color, 0.14),
                borderColor: challenge.color + '55',
                color: challenge.color,
                boxShadow: `0 0 18px ${challenge.color}30`,
              }}>
              <Zap size={13} fill="currentColor" /> Lancer le challenge
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
