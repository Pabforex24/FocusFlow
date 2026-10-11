import { useState } from 'react'
import { CalendarClock } from 'lucide-react'
import Modal from './Modal.jsx'
import { Button } from './ui/Button.jsx'
import { Field, Input } from './ui/Input.jsx'
import { useData } from '../contexts/DataContext.jsx'
import { addDays, formatShort } from '../lib/dates.js'

// Report d'une tâche à une date choisie (y compris une tâche en retard → aujourd'hui).
export default function PostponeDialog({ task, onClose }) {
  const { today, actions } = useData()
  const [day, setDay] = useState(task.scheduled_on < today ? today : addDays(task.scheduled_on, 1))
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!day) return
    setBusy(true)
    const ok = await actions.editTask(task.id, { scheduled_on: day, postponed: true })
    setBusy(false)
    if (ok) onClose()
  }

  return (
    <Modal title="Reporter la tâche" description={task.title} icon={CalendarClock} size="sm" onClose={onClose}>
      <form className="space-y-4" onSubmit={submit}>
        <Field label="Nouvelle date" hint={`Actuellement le ${formatShort(task.scheduled_on)}`}>
          <Input type="date" value={day} onChange={(e) => setDay(e.target.value)} autoFocus />
        </Field>
        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button type="submit" loading={busy} disabled={!day}>Reporter</Button>
        </div>
      </form>
    </Modal>
  )
}
