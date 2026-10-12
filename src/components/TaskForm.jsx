import { useState } from 'react'
import { ListPlus, Pencil, Repeat } from 'lucide-react'
import Modal from './Modal.jsx'
import { Button } from './ui/Button.jsx'
import { Field, Input, Select } from './ui/Input.jsx'
import { Segmented } from './ui/Segmented.jsx'
import { WeekdayPicker } from './ui/WeekdayPicker.jsx'
import { useData } from '../contexts/DataContext.jsx'
import { addDays, diffDays, todayKey, weekdayIndex } from '../lib/dates.js'
import { GENERATED_TASK_XP } from '../lib/challenges.js'

const PRIORITIES = [{ value: 'low', label: 'Basse' }, { value: 'medium', label: 'Normale' }, { value: 'high', label: 'Haute' }]
const REPEATS = [['none', 'Aucune'], ['daily', 'Tous les jours'], ['workdays', 'Jours ouvrés'], ['weekend', 'Week-end'], ['custom', 'Personnalisée']]
const END_MODES = [{ value: 'days', label: 'Nombre de jours' }, { value: 'until', label: 'Date de fin' }]

export default function TaskForm({ task, defaultDay, challengeId, onClose }) {
  const { tasks, domains, goals, actions } = useData()
  const editing = Boolean(task)
  const inChallenge = Boolean(challengeId || task?.challenge_active_id)
  const seriesRows = task?.series_id ? tasks.filter((t) => t.series_id === task.series_id) : []
  const isSeries = seriesRows.length > 0
  const seriesStart = isSeries ? seriesRows.reduce((m, t) => (t.scheduled_on < m ? t.scheduled_on : m), seriesRows[0].scheduled_on) : null
  const seriesEnd = isSeries ? seriesRows.reduce((m, t) => (t.scheduled_on > m ? t.scheduled_on : m), seriesRows[0].scheduled_on) : null
  const storedRepeat = isSeries ? (seriesRows.find((t) => t.repeat)?.repeat ?? {}) : {}

  const [form, setForm] = useState({
    title: task?.title ?? '', domain_id: task?.domain_id ?? '', goal_id: task?.goal_id ?? '',
    scheduled_on: task?.scheduled_on ?? defaultDay ?? '', duration: task?.duration ?? '', priority: task?.priority ?? 'medium',
  })
  const [repeat, setRepeat] = useState(() => isSeries
    ? { frequency: storedRepeat.frequency ?? 'daily', mode: 'days', days: diffDays(seriesStart, seriesEnd) + 1, until: seriesEnd, weekdays: storedRepeat.weekdays ?? [] }
    : { frequency: 'none', mode: 'days', days: 14, until: addDays(defaultDay ?? todayKey(), 13), weekdays: [weekdayIndex(defaultDay ?? todayKey())] })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const goalOptions = goals.filter((g) => !form.domain_id || g.domain_id === form.domain_id)

  const recurring = repeat.frequency !== 'none'
  const startDate = isSeries ? seriesStart : form.scheduled_on
  const freqOptions = isSeries ? REPEATS.filter(([v]) => v !== 'none') : REPEATS

  const submit = async (e) => {
    e.preventDefault()
    const found = {}
    if (!form.title.trim()) found.title = 'Donnez un titre à la tâche.'
    if (!isSeries && !form.scheduled_on) found.scheduled_on = 'Choisissez une date.'
    else if (!isSeries && !editing && form.scheduled_on < todayKey()) found.scheduled_on = 'Choisissez une date à partir d\'aujourd\'hui.'
    if (recurring && repeat.mode === 'until' && (!repeat.until || repeat.until < startDate)) found.until = 'La date de fin doit être après le début.'
    if (recurring && repeat.mode === 'days' && (Number(repeat.days) < 1 || Number(repeat.days) > 90)) found.days = 'Entre 1 et 90 jours.'
    if (recurring && repeat.frequency === 'custom' && repeat.weekdays.length === 0) found.weekdays = 'Choisissez au moins un jour.'
    setErrors(found)
    if (Object.keys(found).length) return
    setBusy(true)
    const fields = {
      title: form.title.trim(), domain_id: form.domain_id || null, goal_id: form.goal_id || null,
      duration: form.duration.trim() || null, priority: form.priority,
    }
    let ok
    if (editing && (isSeries || recurring)) {
      ok = await actions.saveSeries(task, fields, { ...repeat, start: startDate })
    } else if (editing) {
      ok = await actions.editTask(task.id, { ...fields, scheduled_on: form.scheduled_on })
    } else {
      const payload = { ...fields, scheduled_on: form.scheduled_on }
      if (challengeId) { payload.challenge_active_id = challengeId; payload.xp_value = GENERATED_TASK_XP }
      ok = await actions.addTask(payload, challengeId ? undefined : repeat)
    }
    setBusy(false)
    if (ok) onClose()
  }

  return (
    <Modal title={editing ? 'Modifier la tâche' : 'Nouvelle tâche'} icon={editing ? Pencil : ListPlus} onClose={onClose}>
      <form className="space-y-4" onSubmit={submit} noValidate>
        <Field label="Titre" error={errors.title}><Input value={form.title} onChange={set('title')} maxLength={140} autoFocus placeholder="Ex. 30 minutes de lecture" /></Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {isSeries ? (
            <Field label="Série" hint={`Début le ${seriesStart}`}><div className="flex min-h-11 items-center rounded-xl border border-line bg-surface-2/50 px-3 text-sm text-muted">{seriesRows.length} occurrence{seriesRows.length > 1 ? 's' : ''}</div></Field>
          ) : (
            <Field label="Date" error={errors.scheduled_on}><Input type="date" value={form.scheduled_on} min={editing ? undefined : todayKey()} onChange={set('scheduled_on')} /></Field>
          )}
          <Field label="Durée" hint="Optionnel, ex. 30min"><Input value={form.duration} onChange={set('duration')} maxLength={20} placeholder="30min" /></Field>
          <Field label="Domaine">
            <Select value={form.domain_id} onChange={(e) => setForm((f) => ({ ...f, domain_id: e.target.value, goal_id: '' }))}>
              <option value="">Aucun</option>{domains.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </Field>
          <Field label="Objectif">
            <Select value={form.goal_id} onChange={set('goal_id')}>
              <option value="">Aucun</option>{goalOptions.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Priorité"><Segmented fill value={form.priority} onChange={(v) => setForm((f) => ({ ...f, priority: v }))} options={PRIORITIES} /></Field>

        {!inChallenge && (
          <div className="space-y-4 rounded-2xl border border-line bg-surface-2/40 p-3.5">
            {isSeries && <p className="text-xs text-muted">Répétition de toute la série ({seriesRows.length} occurrences).</p>}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Répéter"><Select value={repeat.frequency} onChange={(e) => setRepeat((r) => ({ ...r, frequency: e.target.value }))}>{freqOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></Field>
              {recurring && <Field label="Fin"><Segmented fill value={repeat.mode} onChange={(v) => setRepeat((r) => ({ ...r, mode: v }))} options={END_MODES} /></Field>}
            </div>
            {recurring && repeat.mode === 'days' && (
              <Field label="Sur combien de jours" error={errors.days} hint="De 1 à 90"><Input type="number" min="1" max="90" value={repeat.days} onChange={(e) => setRepeat((r) => ({ ...r, days: e.target.value }))} /></Field>
            )}
            {recurring && repeat.mode === 'until' && (
              <Field label="Jusqu'au (inclus)" error={errors.until}><Input type="date" min={startDate} value={repeat.until} onChange={(e) => setRepeat((r) => ({ ...r, until: e.target.value }))} /></Field>
            )}
            {recurring && repeat.frequency === 'custom' && (
              <Field label="Jours de la semaine" error={errors.weekdays}>
                <WeekdayPicker value={repeat.weekdays} onChange={(weekdays) => setRepeat((r) => ({ ...r, weekdays }))} />
              </Field>
            )}
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button type="submit" loading={busy}>{editing ? 'Enregistrer' : 'Ajouter la tâche'}</Button>
        </div>
      </form>
    </Modal>
  )
}
