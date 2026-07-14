'use client'

import { useState, useEffect } from 'react'
import { Modal, Field, inputCls, selectCls } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { DomainIcon } from '@/components/domain/DomainIcon'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Repeat } from 'lucide-react'


const FREQ_OPTIONS = [
  { value: 'daily',    label: 'Chaque jour'    },
  { value: 'workdays', label: 'Jours ouvrables' },
  { value: 'weekend',  label: 'Week-end'        },
  { value: 'custom',   label: 'Jours personnalisés' },
]

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

export function TaskModal({ open, onClose, onSave, onSaveRecurring, domains, goals, defaultDate, existing }) {
  const [title,         setTitle]         = useState('')
  const [domainId,      setDomainId]      = useState('')
  const [goalId,        setGoalId]        = useState('')
  const [duration,      setDuration]      = useState('')
  const [scheduledDate, setScheduledDate] = useState(format(defaultDate || new Date(), 'yyyy-MM-dd'))
  const [timeOfDay,     setTimeOfDay]     = useState('08:00')
  const [priority,      setPriority]      = useState('medium')

  // Mode récurrence
  const [isRecurring,   setIsRecurring]   = useState(false)
  const [frequency,     setFrequency]     = useState('daily')
  const [customDays,    setCustomDays]    = useState([])
  const [endDate,       setEndDate]       = useState('')

  useEffect(() => {
    if (open) {
      if (existing) {
        setTitle(existing.title)
        setDomainId(existing.domainId || '')
        setGoalId(existing.goalId || '')
        setDuration(existing.duration || '')
        setScheduledDate(existing.scheduledAt.split('T')[0])
        setPriority(existing.priority || 'medium')
        setIsRecurring(false)
      } else {
        setTitle('')
        setDomainId('')
        setGoalId('')
        setDuration('')
        setScheduledDate(format(defaultDate || new Date(), 'yyyy-MM-dd'))
        setPriority('medium')
        setIsRecurring(false)
      }
      setFrequency('daily')
      setCustomDays([])
      setEndDate('')
      setTimeOfDay('08:00')
    }
  }, [open, defaultDate, existing])

  const filteredGoals = domainId ? goals.filter((g) => g.domainId === domainId) : goals

  const handleDomainChange = (val) => { setDomainId(val); setGoalId('') }
  const handleGoalChange   = (val) => {
    setGoalId(val)
    const g = goals.find((g) => g.id === val)
    if (g?.domainId) setDomainId(g.domainId)
  }

  const toggleDay = (day) =>
    setCustomDays((d) => d.includes(day) ? d.filter((x) => x !== day) : [...d, day])

  const handleSave = () => {
    if (!title.trim()) return

    if (isRecurring && onSaveRecurring) {
      // Créer un template récurrent
      onSaveRecurring({
        title:      title.trim(),
        domainId:   domainId  |,
        goalId:     goalId    |,
        duration:   duration  |,
        priority,
        xpValue:    10,
        frequency,
        customDays: frequency === 'custom' ? customDays,
        timeOfDay,
        startDate:  scheduledDate,
        endDate:    endDate   |,
        active:     true,
      })
    } else {
      // Tâche unique classique
      onSave({
        title:       title.trim(),
        domainId:    domainId |,
        goalId:      goalId   |,
        duration:    duration |,
        scheduledAt: new Date(scheduledDate + 'T' + timeOfDay + ':00').toISOString(),
        done:        existing?.done ?? false,
        xpValue:     10,
        priority,
      })
    }

    onClose()
  }

  const selectedDomain = domains.find((d) => d.id === domainId)

  return (
    <Modal open={open} onClose={onClose} title={existing ? 'Modifier la tâche' : 'Nouvelle tâche'}>

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
        <Field label="Date de départ">
          <input type="date" className={inputCls} value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
        </Field>
        <Field label="Heure">
          <input type="time" className={inputCls} value={timeOfDay} onChange={(e) => setTimeOfDay(e.target.value)} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Durée estimée">
          <input className={inputCls} value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="ex: 1h30" />
        </Field>
        <Field label="Priorité">
          <select className={selectCls} value={priority} onChange={(e) => setPriority(e.target.value  priority)}>
            <option value="high">🔴 Haute</option>
            <option value="medium">🟡 Moyenne</option>
            <option value="low">⚪ Basse</option>
          </select>
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

      {/* ── Toggle Répéter ──────────────────────────────────────────────── */}
      {!existing && onSaveRecurring && (
        <button
          type="button"
          onClick={() => setIsRecurring((v) => !v)}
          className={cn(
            'w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all',
            isRecurring
              ? 'border-accent/50 bg-accent/10 text-accent'
              : 'border-border bg-bg-3 text-content-3 hover:text-content-2'
          )}
        >
          <span className="flex items-center gap-2">
            <Repeat size={14} />
            Tâche récurrente
          </span>
          <div
            className={cn(
              'w-9 h-5 rounded-full transition-all relative',
              isRecurring ? 'bg-accent' : 'bg-bg-4'
            )}
          >
            <div
              className={cn(
                'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all',
                isRecurring ? 'left-[18px]' : 'left-0.5'
              )}
            />
          </div>
        </button>
      )}

      {/* ── Options de récurrence ───────────────────────────────────────── */}
      {isRecurring && (
        <div
          className="rounded-xl p-4 flex flex-col gap-3"
          style={{ background: 'rgba(123,94,167,0.07)', border: '1px solid rgba(123,94,167,0.2)' }}
        >
          <Field label="Fréquence">
            <select
              className={selectCls}
              value={frequency}
              onChange={(e) => { setFrequency(e.target.value ); setCustomDays([]) }}
            >
              {FREQ_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </Field>

          {frequency === 'custom' && (
            <Field label="Jours de la semaine">
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
                        active
                          ? 'bg-accent/20 border-accent/60 text-accent'
                          : 'bg-bg-3 border-border text-content-3'
                      )}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </Field>
          )}

          <Field label="Date de fin (optionnel)">
            <input
              type="date"
              className={inputCls}
              value={endDate}
              min={scheduledDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </Field>

          <p className="text-[11px]" style={{ color: '#4A5E80' }}>
            💡 Une tâche sera créée automatiquement chaque jour correspondant à cette fréquence.
          </p>
        </div>
      )}

      <div className="flex gap-2 justify-end mt-2">
        <Button variant="ghost" onClick={onClose}>Annuler</Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={!title.trim() || (isRecurring && frequency === 'custom' && customDays.length === 0)}
        >
          {isRecurring ? '🔁 Créer la récurrence' : 'Enregistrer'}
        </Button>
      </div>
    </Modal>
  )
}
