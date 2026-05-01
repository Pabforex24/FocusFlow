'use client'

import { useState, useEffect } from 'react'
import { Modal, Field, inputCls, selectCls } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Domain, Goal, Task, FrequencyType } from '@/types'
import { DomainIcon } from '@/components/domain/DomainIcon'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface TaskModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: Omit<Task, 'id' | 'createdAt'>) => void
  domains: Domain[]
  goals: Goal[]
  defaultDate?: Date
}

const FREQ_OPTIONS: { value: FrequencyType; label: string }[] = [
  { value: 'daily',    label: 'Chaque jour'    },
  { value: 'workdays', label: 'Jours ouvrables' },
  { value: 'weekend',  label: 'Week-end'        },
  { value: 'custom',   label: 'Personnalisé'    },
]

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

export function TaskModal({ open, onClose, onSave, domains, goals, defaultDate }: TaskModalProps) {
  const [title,         setTitle]         = useState('')
  const [domainId,      setDomainId]      = useState('')
  const [goalId,        setGoalId]        = useState('')
  const [duration,      setDuration]      = useState('')
  const [scheduledDate, setScheduledDate] = useState(format(defaultDate || new Date(), 'yyyy-MM-dd'))
  const [frequency,     setFrequency]     = useState<FrequencyType | ''>('')
  const [customDays,    setCustomDays]    = useState<number[]>([])

  useEffect(() => {
    if (open) {
      setScheduledDate(format(defaultDate || new Date(), 'yyyy-MM-dd'))
      setFrequency('')
      setCustomDays([])
    }
  }, [open, defaultDate])

  const filteredGoals = domainId ? goals.filter((g) => g.domainId === domainId) : goals

  const handleDomainChange = (val: string) => { setDomainId(val); setGoalId('') }
  const handleGoalChange   = (val: string) => {
    setGoalId(val)
    const g = goals.find((g) => g.id === val)
    if (g?.domainId) setDomainId(g.domainId)
  }

  const toggleDay = (day: number) =>
    setCustomDays((d) => d.includes(day) ? d.filter((x) => x !== day) : [...d, day])

  const handleSave = () => {
    if (!title.trim()) return
    onSave({
      title: title.trim(),
      domainId: domainId || undefined,
      goalId:   goalId   || undefined,
      duration: duration || undefined,
      scheduledAt: new Date(scheduledDate + 'T08:00:00').toISOString(),
      done: false,
      xpValue: 10,
      priority: 'medium',
      frequency: frequency || undefined,
      customDays: frequency === 'custom' ? customDays : undefined,
    })
    setTitle(''); setDuration(''); setGoalId(''); setFrequency(''); setCustomDays([])
    onClose()
  }

  const selectedDomain = domains.find((d) => d.id === domainId)

  return (
    <Modal open={open} onClose={onClose} title="Nouvelle tâche">
      <Field label="Titre de la tâche">
        <input
          className={inputCls}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="ex: 1h30 de backtest EUR/USD"
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          autoFocus
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Date">
          <input type="date" className={inputCls} value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
        </Field>
        <Field label="Durée estimée">
          <input className={inputCls} value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="ex: 1h30" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Domaine">
          <div className="relative">
            <select
              className={selectCls}
              value={domainId}
              onChange={(e) => handleDomainChange(e.target.value)}
              style={selectedDomain ? { paddingLeft: '2.2rem' } : {}}
            >
              <option value="">— Optionnel —</option>
              {domains.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            {selectedDomain && (
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <DomainIcon name={selectedDomain.icon} size={14} color={selectedDomain.color} />
              </div>
            )}
          </div>
        </Field>

        <Field label="Objectif lié">
          <select className={selectCls} value={goalId} onChange={(e) => handleGoalChange(e.target.value)}>
            <option value="">— Optionnel —</option>
            {filteredGoals.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
          </select>
        </Field>
      </div>

      {/* Fréquence (optionnel) */}
      <Field label="Fréquence (optionnel)">
        <select className={selectCls} value={frequency} onChange={(e) => { setFrequency(e.target.value as FrequencyType | ''); setCustomDays([]) }}>
          <option value="">— Tâche unique —</option>
          {FREQ_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </Field>

      {/* Jours personnalisés */}
      {frequency === 'custom' && (
        <Field label="Jours">
          <div className="flex gap-1.5 flex-wrap">
            {DAY_LABELS.map((label, idx) => {
              const active = customDays.includes(idx)
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleDay(idx)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-bold border transition-all',
                    active ? 'bg-accent/20 border-accent/60 text-accent' : 'bg-bg-3 border-border text-content-3'
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </Field>
      )}

      <div className="flex gap-2 justify-end mt-2">
        <Button variant="ghost" onClick={onClose}>Annuler</Button>
        <Button variant="primary" onClick={handleSave} disabled={!title.trim()}>Enregistrer</Button>
      </div>
    </Modal>
  )
}
