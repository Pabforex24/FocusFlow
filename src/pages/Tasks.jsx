import { useCallback, useState } from 'react'
import { CalendarCheck, CalendarX, ChevronLeft, ChevronRight, ListChecks, Plus, ShieldCheck, Timer } from 'lucide-react'
import TaskForm from '../components/TaskForm.jsx'
import TaskItem from '../components/TaskItem.jsx'
import { Alert } from '../components/ui/Alert.jsx'
import { Button, IconButton } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx'
import { EmptyState } from '../components/ui/EmptyState.jsx'
import { PageHeader } from '../components/ui/PageHeader.jsx'
import { ProgressRing } from '../components/ui/ProgressBar.jsx'
import { useData } from '../contexts/DataContext.jsx'
import { useFocus } from '../contexts/FocusContext.jsx'
import { useOpenOnNew } from '../hooks/useOpenOnNew.js'
import { addDays, formatLong } from '../lib/dates.js'

export default function Tasks() {
  const { tasks, today, restDays, actions } = useData()
  const { openPicker } = useFocus()
  const [day, setDay] = useState(today)
  const [form, setForm] = useState(null) // null | { task? }
  const [toDelete, setToDelete] = useState(null)
  useOpenOnNew(useCallback(() => setForm({}), []))

  const dayTasks = tasks.filter((t) => t.scheduled_on === day).sort((a, b) => a.created_at.localeCompare(b.created_at))
  const todo = dayTasks.filter((t) => !t.done)
  const done = dayTasks.filter((t) => t.done)
  const pct = dayTasks.length ? Math.round((done.length / dayTasks.length) * 100) : 0
  const isRest = restDays.includes(day)
  const label = day === today ? "Aujourd'hui" : day === addDays(today, 1) ? 'Demain' : day === addDays(today, -1) ? 'Hier' : null

  return (
    <>
      <PageHeader title="Tâches" subtitle={formatLong(day)}>
        <Button variant="secondary" icon={Timer} onClick={() => openPicker()}>Focus</Button>
        <Button icon={Plus} onClick={() => setForm({})}>Nouvelle tâche</Button>
      </PageHeader>

      <div className="mb-4 flex items-center justify-between gap-2">
        <IconButton icon={ChevronLeft} label="Jour précédent" variant="secondary" onClick={() => setDay(addDays(day, -1))} />
        <button type="button" onClick={() => setDay(today)} disabled={day === today}
          className="min-h-11 flex-1 rounded-xl px-3 text-center text-sm font-semibold text-fg transition hover:bg-surface-2 disabled:pointer-events-none">
          {label ?? 'Revenir à aujourd\'hui'}
        </button>
        <IconButton icon={ChevronRight} label="Jour suivant" variant="secondary" onClick={() => setDay(addDays(day, 1))} />
      </div>

      <div className="space-y-4">
        <Card className="flex items-center gap-4">
          <ProgressRing value={pct} size={64} stroke={6} tone={pct === 100 ? 'success' : 'brand'} />
          <div className="min-w-0">
            <p className="text-base font-semibold text-fg">{done.length} sur {dayTasks.length} terminée{done.length > 1 ? 's' : ''}</p>
            <p className="text-sm text-muted">
              {dayTasks.length === 0 ? 'Aucune tâche prévue ce jour.' : pct === 100 ? 'Journée parfaite, bravo !' : `${todo.length} restante${todo.length > 1 ? 's' : ''} pour aujourd'hui.`}
            </p>
          </div>
        </Card>

        {isRest && <Alert tone="success" icon={ShieldCheck} title="Imprévu déclaré">Votre série est protégée pour ce jour.</Alert>}
        {!isRest && day === today && todo.length > 0 && (
          <Alert tone="warning" title="Journée compromise ?" action={<Button size="sm" variant="secondary" icon={ShieldCheck} onClick={() => actions.declareRestDay(day)}>Déclarer un imprévu</Button>}>
            Protégez votre série (une fois par semaine).
          </Alert>
        )}

        {dayTasks.length === 0 ? (
          <EmptyState icon={day < today ? CalendarX : CalendarCheck} title="Rien de prévu ce jour"
            action={<Button icon={Plus} onClick={() => setForm({})}>Ajouter une tâche</Button>}>
            Planifiez une action simple pour avancer vers vos objectifs.
          </EmptyState>
        ) : (
          <>
            {todo.length > 0 && (
              <section className="space-y-2.5">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-muted"><ListChecks className="size-4" aria-hidden />À faire · {todo.length}</h2>
                {todo.map((t) => <TaskItem key={t.id} task={t} onEdit={(task) => setForm({ task })} onDelete={setToDelete} />)}
              </section>
            )}
            {done.length > 0 && (
              <section className="space-y-2.5">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-muted"><ListChecks className="size-4" aria-hidden />Terminées · {done.length}</h2>
                {done.map((t) => <TaskItem key={t.id} task={t} onEdit={(task) => setForm({ task })} onDelete={setToDelete} />)}
              </section>
            )}
          </>
        )}
      </div>

      {form && <TaskForm task={form.task} defaultDay={day} onClose={() => setForm(null)} />}
      {toDelete && (
        <ConfirmDialog title="Supprimer la tâche ?" message={`« ${toDelete.title} » sera supprimée définitivement.`}
          onConfirm={async () => { await actions.removeTask(toDelete.id); setToDelete(null) }} onCancel={() => setToDelete(null)} />
      )}
    </>
  )
}
