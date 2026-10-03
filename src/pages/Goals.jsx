import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, Layers, Pencil, Plus, Target, Trash2 } from 'lucide-react'
import DomainTile from '../components/DomainTile.jsx'
import Modal from '../components/Modal.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx'
import { EmptyState } from '../components/ui/EmptyState.jsx'
import { Field, Input, Select, Textarea } from '../components/ui/Input.jsx'
import { Menu } from '../components/ui/Menu.jsx'
import { PageHeader } from '../components/ui/PageHeader.jsx'
import { ProgressBar } from '../components/ui/ProgressBar.jsx'
import { useData } from '../contexts/DataContext.jsx'
import { useOpenOnNew } from '../hooks/useOpenOnNew.js'
import { diffDays, formatShort } from '../lib/dates.js'
import { goalProgress } from '../lib/stats.js'
import { cn } from '../lib/cn.js'

function GoalForm({ goal, defaultDomain, onClose }) {
  const { domains, actions } = useData()
  const [form, setForm] = useState({ title: goal?.title ?? '', description: goal?.description ?? '', domain_id: goal?.domain_id ?? defaultDomain ?? domains[0]?.id ?? '', deadline: goal?.deadline ?? '' })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    const found = {}
    if (!form.title.trim()) found.title = 'Donnez un titre à l\'objectif.'
    if (!form.domain_id) found.domain_id = 'Choisissez un domaine.'
    setErrors(found)
    if (Object.keys(found).length) return
    setBusy(true)
    const payload = { title: form.title.trim(), description: form.description.trim() || null, domain_id: form.domain_id, deadline: form.deadline || null }
    const ok = goal ? await actions.editGoal(goal.id, payload) : await actions.addGoal(payload)
    setBusy(false)
    if (ok) onClose()
  }

  return (
    <Modal title={goal ? 'Modifier l\'objectif' : 'Nouvel objectif'} icon={Target} onClose={onClose}>
      <form className="space-y-4" onSubmit={submit} noValidate>
        <Field label="Titre" error={errors.title}><Input value={form.title} onChange={set('title')} maxLength={120} autoFocus placeholder="Ex. Courir un semi-marathon" /></Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Domaine" error={errors.domain_id}><Select value={form.domain_id} onChange={set('domain_id')}>{domains.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</Select></Field>
          <Field label="Échéance" hint="Optionnel"><Input type="date" value={form.deadline} onChange={set('deadline')} /></Field>
        </div>
        <Field label="Description" hint="Optionnel"><Textarea rows={3} value={form.description} onChange={set('description')} maxLength={500} /></Field>
        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button type="submit" loading={busy}>Enregistrer</Button>
        </div>
      </form>
    </Modal>
  )
}

// Statut lisible d'un objectif : { tone, label }
function goalStatus(goal, progress, today) {
  if (progress.total > 0 && progress.pct === 100) return { tone: 'success', label: 'Atteint' }
  if (goal.deadline && goal.deadline < today) return { tone: 'danger', label: 'En retard' }
  if (progress.total === 0) return { tone: 'neutral', label: 'Sans tâche' }
  return { tone: 'brand', label: 'En cours' }
}

export default function Goals() {
  const { domains, goals, tasks, today, actions } = useData()
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  useOpenOnNew(useCallback(() => setForm({}), []))

  const visible = goals.filter((g) => filter === 'all' || g.domain_id === filter)

  return (
    <>
      <PageHeader title="Objectifs" subtitle="La progression se calcule à partir des tâches liées">
        <Button icon={Plus} onClick={() => setForm({})} disabled={domains.length === 0}>Nouvel objectif</Button>
      </PageHeader>

      {domains.length === 0 ? (
        <EmptyState icon={Layers} title="Créez d'abord un domaine" action={<Link to="/domains?new=1" className="inline-flex h-11 items-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-500">Créer un domaine</Link>}>
          Un objectif appartient toujours à un domaine (Sport, Études…).
        </EmptyState>
      ) : goals.length === 0 ? (
        <EmptyState icon={Target} title="Aucun objectif" action={<Button icon={Plus} onClick={() => setForm({})}>Créer un objectif</Button>}>
          Un objectif donne un sens à vos tâches quotidiennes et mesure vos progrès.
        </EmptyState>
      ) : (
        <>
          <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="tablist" aria-label="Filtrer par domaine">
            {[{ id: 'all', name: 'Tous' }, ...domains].map((d) => (
              <button key={d.id} type="button" role="tab" aria-selected={filter === d.id} onClick={() => setFilter(d.id)}
                className={cn('min-h-9 shrink-0 rounded-full border px-4 text-sm font-medium transition', filter === d.id ? 'border-brand-600 bg-brand-600 text-white' : 'border-line bg-surface text-muted hover:text-fg')}>
                {d.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {visible.map((g) => {
              const domain = domains.find((d) => d.id === g.domain_id)
              const p = goalProgress(g, tasks)
              const status = goalStatus(g, p, today)
              const left = g.deadline ? diffDays(today, g.deadline) : null
              return (
                <Card key={g.id} interactive className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <DomainTile domain={domain} />
                      <div className="min-w-0">
                        <h2 className="text-base leading-snug font-semibold break-words text-fg">{g.title}</h2>
                        <p className="text-sm text-muted">{domain?.name ?? 'Sans domaine'}</p>
                      </div>
                    </div>
                    <Menu items={[{ label: 'Modifier', icon: Pencil, onClick: () => setForm({ goal: g }) }, { label: 'Supprimer', icon: Trash2, danger: true, onClick: () => setToDelete(g) }]} />
                  </div>
                  {g.description && <p className="line-clamp-2 text-sm text-muted">{g.description}</p>}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm"><span className="text-muted">{p.done}/{p.total} tâches</span><span className="font-semibold tabular-nums text-fg">{p.pct} %</span></div>
                    <ProgressBar value={p.pct} color={domain?.color} tone={status.tone === 'success' ? 'success' : 'brand'} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={status.tone}>{status.label}</Badge>
                    {g.deadline && (
                      <Badge tone="neutral" icon={CalendarClock}>
                        {left < 0 ? `Échue le ${formatShort(g.deadline)}` : left === 0 ? "Échéance aujourd'hui" : `${left} j restants · ${formatShort(g.deadline)}`}
                      </Badge>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
          {visible.length === 0 && <p className="py-8 text-center text-sm text-muted">Aucun objectif dans ce domaine.</p>}
        </>
      )}

      {form && <GoalForm goal={form.goal} defaultDomain={filter !== 'all' ? filter : undefined} onClose={() => setForm(null)} />}
      {toDelete && (
        <ConfirmDialog title="Supprimer l'objectif ?" message={`« ${toDelete.title} » sera supprimé. Les tâches liées sont conservées.`}
          onConfirm={async () => { await actions.removeGoal(toDelete.id); setToDelete(null) }} onCancel={() => setToDelete(null)} />
      )}
    </>
  )
}
