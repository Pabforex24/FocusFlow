import { useState } from 'react'
import { ListPlus, Pencil } from 'lucide-react'
import Modal from './Modal.jsx'
import { Button } from './ui/Button.jsx'
import { Field, Input, Select } from './ui/Input.jsx'
import { Segmented } from './ui/Segmented.jsx'
import { useData } from '../contexts/DataContext.jsx'

const PRIORITIES = [{ value: 'low', label: 'Basse' }, { value: 'medium', label: 'Normale' }, { value: 'high', label: 'Haute' }]
const REPEATS = [['none', 'Aucune'], ['daily', 'Tous les jours'], ['workdays', 'Jours ouvrés'], ['weekend', 'Week-end']]

export default function TaskForm({ task, defaultDay, onClose }) {
  const { domains, goals, actions } = useData()
  const editing = Boolean(task)
  const [form, setForm] = useState({
    title: task?.title ?? '', domain_id: task?.domain_id ?? '', goal_id: task?.goal_id ?? '',
    scheduled_on: task?.scheduled_on ?? defaultDay, duration: task?.duration ?? '', priority: task?.priority ?? 'medium',
  })
  const [repeat, setRepeat] = useState({ frequency: 'none', days: 14 })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const goalOptions = goals.filter((g) => !form.domain_id || g.domain_id === form.domain_id)

  const submit = async (e) => {
    e.preventDefault()
    const found = {}
    if (!form.title.trim()) found.title = 'Donnez un titre à la tâche.'
    if (!form.scheduled_on) found.scheduled_on = 'Choisissez une date.'
    setErrors(found)
    if (Object.keys(found).length) return
    setBusy(true)
    const payload = {
      title: form.title.trim(), domain_id: form.domain_id || null, goal_id: form.goal_id || null,
      scheduled_on: form.scheduled_on, duration: form.duration.trim() || null, priority: form.priority,
    }
    const ok = editing ? await actions.editTask(task.id, payload) : await actions.addTask(payload, repeat)
    setBusy(false)
    if (ok) onClose()
  }

  return (
    <Modal title={editing ? 'Modifier la tâche' : 'Nouvelle tâche'} icon={editing ? Pencil : ListPlus} onClose={onClose}>
      <form className="space-y-4" onSubmit={submit} noValidate>
        <Field label="Titre" error={errors.title}><Input value={form.title} onChange={set('title')} maxLength={140} autoFocus placeholder="Ex. 30 minutes de lecture" /></Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Date" error={errors.scheduled_on}><Input type="date" value={form.scheduled_on} onChange={set('scheduled_on')} /></Field>
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
        {!editing && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Répéter"><Select value={repeat.frequency} onChange={(e) => setRepeat((r) => ({ ...r, frequency: e.target.value }))}>{REPEATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></Field>
            {repeat.frequency !== 'none' && <Field label="Sur combien de jours" hint="De 1 à 90"><Input type="number" min="1" max="90" value={repeat.days} onChange={(e) => setRepeat((r) => ({ ...r, days: e.target.value }))} /></Field>}
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
