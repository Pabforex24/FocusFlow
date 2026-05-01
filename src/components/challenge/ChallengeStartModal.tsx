'use client'

import { useState } from 'react'
import { Challenge, getOccurrenceDates } from '@/types'
import { useStore } from '@/store'
import { Modal } from '@/components/ui/Modal'
import { DomainIcon } from '@/components/domain/DomainIcon'
import { hexToRgba } from '@/lib/utils'
import { Zap, Calendar, Repeat } from 'lucide-react'
import { addDays, format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface ChallengeStartModalProps {
  challenge: Challenge | null
  onClose: () => void
}

const FREQ_LABEL: Record<string, string> = {
  daily:    'Chaque jour',
  workdays: 'Jours ouvrables',
  weekend:  'Week-end',
  custom:   'Personnalisé',
}

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

export function ChallengeStartModal({ challenge, onClose }: ChallengeStartModalProps) {
  const { domains, startChallenge } = useStore()
  const [domainIdMap, setDomainIdMap] = useState<Record<string, string>>({})
  const [started, setStarted] = useState(false)

  if (!challenge) return null

  // Utilise la deadline explicite si disponible, sinon durationDays
  const startDate = new Date()
  const endDate = challenge.deadline
    ? new Date(challenge.deadline)
    : addDays(startDate, challenge.durationDays)

  // Compte total des occurrences de toutes les tâches
  const totalOccurrences = challenge.blueprints.reduce((sum, bp) => {
    const freq = bp.frequency || 'daily'
    const dates = getOccurrenceDates(startDate, endDate, freq, bp.customDays)
    return sum + dates.length
  }, 0)

  const uniqueBlueprintDomainIds = [...new Set(challenge.blueprints.map((b) => b.domainId))]

  const handleStart = () => {
    const finalMap: Record<string, string> = {}
    uniqueBlueprintDomainIds.forEach((sid) => {
      finalMap[sid] = domainIdMap[sid] || sid
    })
    startChallenge(challenge.id, finalMap)
    setStarted(true)
    setTimeout(onClose, 1200)
  }

  return (
    <Modal open onClose={onClose} title="Démarrer un challenge">
      {started ? (
        <div className="text-center py-8">
          <div
            className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4"
            style={{ background: hexToRgba(challenge.color, 0.2) }}
          >
            <Zap size={28} style={{ color: challenge.color }} />
          </div>
          <p className="font-heading font-bold text-lg text-content">Challenge lancé !</p>
          <p className="text-sm text-content-3 mt-1">
            {totalOccurrences} tâches générées jusqu'au{' '}
            {format(endDate, 'd MMM yyyy', { locale: fr })} 🚀
          </p>
        </div>
      ) : (
        <div className="space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Challenge summary */}
          <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-bg-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: hexToRgba(challenge.color, 0.2) }}
            >
              <DomainIcon name={challenge.icon} size={20} color={challenge.color} />
            </div>
            <div className="min-w-0">
              <p className="font-heading font-bold text-sm text-content">{challenge.title}</p>
              <p className="text-xs text-content-3 truncate">{challenge.description}</p>
            </div>
          </div>

          {/* Duration info */}
          <div className="flex items-center gap-2 text-sm text-content-2 flex-wrap">
            <Calendar size={14} className="text-content-3 flex-shrink-0" />
            <span>
              Du <strong>{format(startDate, 'd MMM', { locale: fr })}</strong> au{' '}
              <strong>{format(endDate, 'd MMM yyyy', { locale: fr })}</strong>
            </span>
            <span
              className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: hexToRgba(challenge.color, 0.15), color: challenge.color }}
            >
              {totalOccurrences} tâches au total
            </span>
          </div>

          {/* Tâches avec fréquence */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-content-3 mb-2 flex items-center gap-1.5">
              <Repeat size={11} /> Tâches générées
            </p>
            <div className="space-y-1.5">
              {challenge.blueprints.map((bp) => {
                const freq = bp.frequency || 'daily'
                const count = getOccurrenceDates(startDate, endDate, freq, bp.customDays).length
                return (
                  <div key={bp.id} className="flex items-center gap-2 text-sm text-content-2 bg-bg-3 rounded-lg px-3 py-2">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: challenge.color }} />
                    <span className="flex-1 min-w-0 truncate">{bp.title}</span>
                    <span className="text-xs text-content-3 font-medium whitespace-nowrap">{bp.duration}</span>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap"
                      style={{ background: hexToRgba(challenge.color, 0.12), color: challenge.color }}
                    >
                      {FREQ_LABEL[freq]} · {count}×
                    </span>
                  </div>
                )
              })}
            </div>
            {challenge.blueprints.some((bp) => bp.frequency === 'custom') && (
              <p className="text-[11px] text-content-3 mt-1.5 px-1">
                Personnalisé : {challenge.blueprints
                  .filter((bp) => bp.frequency === 'custom')
                  .map((bp) => (bp.customDays || []).map((d) => DAY_LABELS[d]).join(', '))
                  .join(' | ')
                }
              </p>
            )}
          </div>

          {/* Domain mapping */}
          {domains.filter((d) => !d.id.startsWith('seed')).length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-content-3 mb-2">
                Associer à tes domaines (optionnel)
              </p>
              {uniqueBlueprintDomainIds.map((seedId) => {
                const seedBp = challenge.blueprints.find((b) => b.domainId === seedId)!
                return (
                  <div key={seedId} className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-content-2 w-24 truncate">{seedBp.title.split(' ').slice(0, 2).join(' ')}…</span>
                    <select
                      className="flex-1 text-xs bg-bg-3 border border-border rounded-lg px-2 py-1.5 text-content"
                      value={domainIdMap[seedId] || ''}
                      onChange={(e) =>
                        setDomainIdMap((m) => ({ ...m, [seedId]: e.target.value || seedId }))
                      }
                    >
                      <option value="">— Domaine par défaut —</option>
                      {domains.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                )
              })}
            </div>
          )}

          {/* CTA */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 flex items-center justify-center px-3 py-2 rounded-xl text-sm font-medium border border-border text-content-3 hover:text-content transition-all"
            >
              Annuler
            </button>
            <button
              onClick={handleStart}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold border transition-all duration-200"
              style={{
                background: hexToRgba(challenge.color, 0.14),
                borderColor: challenge.color + '55',
                color: challenge.color,
                boxShadow: `0 0 18px ${challenge.color}30`,
              }}
            >
              <Zap size={13} fill="currentColor" /> Lancer le challenge
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
