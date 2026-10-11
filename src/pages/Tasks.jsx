import { useCallback, useState } from 'react'
import { CalendarCheck, CalendarClock, CalendarX, ChevronLeft, ChevronRight, ListChecks, Plus, ShieldCheck, Shuffle, Timer, Trash2 } from 'lucide-react'
import TaskForm from '../components/TaskForm.jsx'
import TaskItem from '../components/TaskItem.jsx'
import PostponeDialog from '../components/PostponeDialog.jsx'
import Modal from '../components/Modal.jsx'
import { Alert } from '../components/ui/Alert.jsx'
import { Button, IconButton } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx'
import { EmptyState } from '../components/ui/EmptyState.jsx'
import { Input } from '../components/ui/Input.jsx'
import { PageHeader } from '../components/ui/PageHeader.jsx'
import { ProgressRing } from '../components/ui/ProgressBar.jsx'
import { useData } from '../contexts/DataContext.jsx'
import { useFocus } from '../contexts/FocusContext.jsx'
import { useOpenOnNew } from '../hooks/useOpenOnNew.js'
import { addDays, formatLong, formatShort } from '../lib/dates.js'
import { overdueTasks } from '../lib/tasks.js'

function CatchUpModal({ overdue, onClose }) {
  const { today, actions } = useData()
  const [days, setDays] = useState(3)
  const [toDelete, setToDelete] = useState(false)
  const [postpone, setPostpone] = useState(null)
  const ids = overdue.map((t) => t.id)
  const sorted = [...overdue].sort((a, b) => a.scheduled_on.localeCompare(b.scheduled_on))

  const moveAll = async () => { if (await actions.moveTasksTo(ids, today)) onClose() }
  const spread = async () => { if (await actions.spreadTasks(ids, today, days)) onClose() }
  const removeAll = async () => { await actions.removeTasks(ids); setToDelete(false); onClose() }

  return (
    <Modal title="Rattraper les tâches en retard" description={`${overdue.length} tâche${overdue.length > 1 ? 's' : ''} à replacer`} icon={CalendarClock} onClose={onClose}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-2">
          <Button icon={CalendarCheck} onClick={moveAll}>Reporter à aujourd'hui</Button>
          <Button variant="secondary" icon={Shuffle} onClick={spread}>Répartir sur</Button>
          <div className="flex items-center gap-2">
            <Input type="number" min="1" max="90" value={days} onChange={(e) => setDays(e.target.value)} className="w-20" aria-label="Nombre de jours" />
            <span className="text-sm text-muted">jours</span>
          </div>
        </div>

        <ul className="space-y-2">
          {sorted.map((t) => (
            <li key={t.id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface-2/40 p-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400"><CalendarX className="size-4" aria-hidden /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-fg">{t.title}</p>
                <p className="text-xs text-muted">Prévue le {formatShort(t.scheduled_on)}</p>
              </div>
              <IconButton icon={CalendarClock} label="Reporter à une date" variant="secondary" size="sm" onClick={() => setPostpone(t)} />
              <IconButton icon={Trash2} label="Supprimer" variant="danger-soft" size="sm" onClick={() => actions.removeTask(t.id)} />
            </li>
          ))}
        </ul>

        <div className="flex justify-end border-t border-line pt-3">
          <Button variant="danger-soft" icon={Trash2} onClick={() => setToDelete(true)}>Tout supprimer</Button>
        </div>
      </div>

      {postpone && <PostponeDialog task={postpone} onClose={() => setPostpone(null)} />}
      {toDelete && (
        <ConfirmDialog title="Supprimer toutes ces tâches ?" message={`${overdue.length} tâche${overdue.length > 1 ? 's' : ''} en retard ser${overdue.length > 1 ? 'ont' : 'a'} supprimée${overdue.length > 1 ? 's' : ''}.`}
          onCancel={() => setToDelete(false)} onConfirm={removeAll} />
      )}
    </Modal>
  )
}

export default function Tasks() {
  const { tasks, today, restDays, actions } = useData()
  const { openPicker } = useFocus()
  const [day, setDay] = useState(today)
  const [form, setForm] = useState(null) // null | { task? }
  const [toDelete, setToDelete] = useState(null)
  const [postpone, setPostpone] = useState(null)
  const [catchup, setCatchup] = useState(false)
  useOpenOnNew(useCallback(() => setForm({}), []))

  const overdue = overdueTasks(tasks, today)
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
        {overdue.length > 0 && (
          <Alert tone="warning" icon={CalendarX} title={`${overdue.length} tâche${overdue.length > 1 ? 's' : ''} en retard`}
            action={<Button size="sm" variant="secondary" icon={CalendarClock} onClick={() => setCatchup(true)}>Rattraper</Button>}>
            Reportez-les à aujourd'hui ou répartissez-les sur les prochains jours.
          </Alert>
        )}

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
                {todo.map((t) => <TaskItem key={t.id} task={t} onEdit={(task) => setForm({ task })} onDelete={setToDelete} onPostpone={setPostpone} />)}
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

      {form && <TaskForm task={form.task} defaultDay={day < today ? today : day} onClose={() => setForm(null)} />}
      {postpone && <PostponeDialog task={postpone} onClose={() => setPostpone(null)} />}
      {catchup && overdue.length > 0 && <CatchUpModal overdue={overdue} onClose={() => setCatchup(false)} />}
      {toDelete && (
        <ConfirmDialog
          title={toDelete.series_id ? 'Supprimer la série complète ?' : 'Supprimer la tâche ?'}
          message={toDelete.series_id
            ? `« ${toDelete.title} » fait partie d'une répétition : toutes ses occurrences (tous les jours) seront supprimées.`
            : `« ${toDelete.title} » sera supprimée définitivement.`}
          onConfirm={async () => { await actions.removeTask(toDelete.id); setToDelete(null) }} onCancel={() => setToDelete(null)} />
      )}
    </>
  )
}
