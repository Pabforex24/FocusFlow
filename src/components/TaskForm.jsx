import { useState } from 'react'
import { ListPlus, Pencil, Repeat } from 'lucide-react'
import Modal from './Modal.jsx'
import { Button } from './ui/Button.jsx'
import { Checkbox, Field, Input, Select } from './ui/Input.jsx'
import { Alert } from './ui/Alert.jsx'
import { Segmented } from './ui/Segmented.jsx'
import { WeekdayPicker } from './ui/WeekdayPicker.jsx'
import { useData } from '../contexts/DataContext.jsx'
import { addDays, diffDays, todayKey, weekdayIndex } from '../lib/dates.js'
import { GENERATED_TASK_XP } from '../lib/challenges.js'
import { durationFieldValue, taskMinutes } from '../lib/duration.js'

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
    scheduled_on: task?.scheduled_on ?? defaultDay ?? '',
    duration_minutes: durationFieldValue(taskMinutes(task)),
    start_time: task?.start_time?.slice(0, 5) ?? '',
    end_time: task?.end_time?.slice(0, 5) ?? '',
    reminder_minutes: task?.reminder_minutes ?? '',
    focus_linked: task?.focus_linked !== false,
    priority: task?.priority ?? 'medium',
  })
  const [repeat, setRepeat] = useState(() => isSeries
    ? { frequency: storedRepeat.frequency ?? 'daily', mode: 'days', days: diffDays(seriesStart, seriesEnd) + 1, until: seriesEnd, weekdays: storedRepeat.weekdays ?? [] }
    : { frequency: 'none', mode: 'days', days: 14, until: addDays(defaultDay ?? todayKey(), 13), weekdays: [weekdayIndex(defaultDay ?? todayKey())] })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const goalOptions = goals.filter((g) => !form.domain_id || g.domain_id === form.domain_id)
  const selectedGoal = goals.find((g) => g.id === form.goal_id)
  const deadlineWarning = selectedGoal?.deadline && form.scheduled_on && form.scheduled_on > selectedGoal.deadline

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
    const minutes = form.duration_minutes === '' ? null : Number(form.duration_minutes)
    if (minutes !== null && (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440)) found.duration_minutes = 'Saisissez une durée entre 1 et 1 440 minutes.'
    if (form.start_time && form.end_time && form.end_time < form.start_time) found.end_time = 'L\'heure de fin doit suivre l\'heure de début.'
    setErrors(found)
    if (Object.keys(found).length) return
    setBusy(true)
    const fields = {
      title: form.title.trim(), domain_id: form.domain_id || null, goal_id: form.goal_id || null,
      duration: null, duration_minutes: form.duration_minutes === '' ? null : Number(form.duration_minutes),
      start_time: form.start_time || null, end_time: form.end_time || null,
      reminder_minutes: form.reminder_minutes === '' ? null : Number(form.reminder_minutes),
      focus_linked: form.focus_linked, priority: form.priority,
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
            <Field label="Date de début" error={errors.scheduled_on}><Input type="date" value={form.scheduled_on} min={editing ? undefined : todayKey()} onChange={set('scheduled_on')} /></Field>
          )}
          <Field label="Durée" hint="1 à 1 440 minutes" error={errors.duration_minutes} htmlFor="task-duration">
            <div className="relative">
              <Input id="task-duration" type="number" inputMode="numeric" min="1" max="1440" step="1" value={form.duration_minutes} onChange={set('duration_minutes')} placeholder="30" className="pr-12" />
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-subtle">min</span>
            </div>
          </Field>
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Heure de début" hint="Optionnel"><Input type="time" value={form.start_time} onChange={set('start_time')} /></Field>
          <Field label="Heure de fin" hint="Optionnel" error={errors.end_time}><Input type="time" value={form.end_time} onChange={set('end_time')} /></Field>
          <Field label="Rappel" hint="Quand l'app est fermée">
            <Select value={form.reminder_minutes} onChange={set('reminder_minutes')}>
              <option value="">Aucun</option>
              <option value="0">À l'heure</option>
              <option value="10">10 min avant</option>
              <option value="30">30 min avant</option>
              <option value="60">1 h avant</option>
            </Select>
          </Field>
        </div>
        <Checkbox checked={form.focus_linked} onChange={(e) => setForm((f) => ({ ...f, focus_linked: e.target.checked }))}
          label="Cocher à la fin d'une session Focus" description="La tâche est validée automatiquement quand le minuteur se termine." />
        <Field label="Priorité"><Segmented fill value={form.priority} onChange={(v) => setForm((f) => ({ ...f, priority: v }))} options={PRIORITIES} /></Field>
        {deadlineWarning && <Alert tone="warning" title="Après la date limite de l'objectif">Cette tâche est planifiée après le {selectedGoal.deadline}. Vous pouvez continuer, mais l'objectif risque d'être en retard.</Alert>}

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
