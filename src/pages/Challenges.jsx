import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, Flag, Hourglass, ListChecks, Pencil, Play, Plus, Trash2, Trophy } from 'lucide-react'
import DomainTile from '../components/DomainTile.jsx'
import Modal from '../components/Modal.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { Button, IconButton } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx'
import { EmptyState } from '../components/ui/EmptyState.jsx'
import { Alert } from '../components/ui/Alert.jsx'
import { Field, Input, Select } from '../components/ui/Input.jsx'
import { Menu } from '../components/ui/Menu.jsx'
import { PageHeader } from '../components/ui/PageHeader.jsx'
import { ProgressBar, ProgressRing } from '../components/ui/ProgressBar.jsx'
import { useData } from '../contexts/DataContext.jsx'
import { CHALLENGE_CATALOGUE, challengeProgress } from '../lib/challenges.js'
import { diffDays, formatShort } from '../lib/dates.js'
import { DOMAIN_COLORS } from '../lib/icons.js'

const FREQ = [['daily', 'Tous les jours'], ['workdays', 'Jours ouvrés'], ['weekend', 'Week-end']]
const FREQ_LABEL = Object.fromEntries(FREQ)

function StartModal({ challenge, onClose }) {
  const { domains, goals, today, actions } = useData()
  const [startKey, setStartKey] = useState(today)
  const [domainId, setDomainId] = useState(domains[0]?.id ?? '')
  const [goalId, setGoalId] = useState('')
  const [busy, setBusy] = useState(false)

  if (domains.length === 0) {
    return (
      <Modal title={challenge.title} icon={Flag} onClose={onClose}>
        <p className="text-sm text-muted">Créez d'abord un domaine pour y ranger les tâches du challenge.</p>
        <Link to="/domains?new=1" className="mt-5 inline-flex h-11 items-center rounded-xl btn-brand px-4 text-sm font-semibold">Créer un domaine</Link>
      </Modal>
    )
  }

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    const ok = await actions.startCatalogueChallenge({ challenge, startKey, domainId, goalId: goalId || null })
    setBusy(false)
    if (ok) onClose()
  }

  return (
    <Modal title={`Démarrer : ${challenge.title}`} icon={Play} onClose={onClose}>
      <form className="space-y-4" onSubmit={submit}>
        <p className="text-sm text-muted">{challenge.durationDays} jours. Les tâches sont créées à l'avance dans votre planning.</p>
        <Field label="Date de début"><Input type="date" value={startKey} min={today} onChange={(e) => setStartKey(e.target.value)} /></Field>
        <Field label="Domaine des tâches"><Select value={domainId} onChange={(e) => { setDomainId(e.target.value); setGoalId('') }}>{domains.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</Select></Field>
        <Field label="Objectif lié" hint="Optionnel"><Select value={goalId} onChange={(e) => setGoalId(e.target.value)}><option value="">Aucun</option>{goals.filter((g) => g.domain_id === domainId).map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}</Select></Field>
        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button type="submit" loading={busy} disabled={!startKey}>Démarrer</Button>
        </div>
      </form>
    </Modal>
  )
}

function CustomForm({ challenge, template, onClose }) {
  const { actions } = useData()
  const source = challenge ?? template
  const [form, setForm] = useState({ title: source?.title ?? '', description: source?.description ?? '', duration_days: source?.duration_days ?? source?.durationDays ?? 30, color: source?.color ?? DOMAIN_COLORS[0] })
  const [blueprints, setBlueprints] = useState(source?.blueprints?.length ? source.blueprints.map((b) => ({ ...b })) : [{ title: '', duration: '', frequency: 'daily' }])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const setBp = (i, k, v) => setBlueprints((l) => l.map((b, idx) => (idx === i ? { ...b, [k]: v } : b)))

  const submit = async (e) => {
    e.preventDefault()
    const clean = blueprints.map((b) => ({ ...b, title: b.title.trim() })).filter((b) => b.title)
    const days = Number(form.duration_days)
    if (!form.title.trim()) return setError('Donnez un titre au challenge.')
    if (!Number.isInteger(days) || days < 1 || days > 365) return setError('La durée doit être comprise entre 1 et 365 jours.')
    if (clean.length === 0) return setError('Ajoutez au moins une tâche récurrente.')
    setError('')
    setBusy(true)
    const payload = { title: form.title.trim(), description: form.description.trim(), duration_days: days, color: form.color, blueprints: clean }
    const ok = challenge ? await actions.editCustomChallenge(challenge.id, payload) : await actions.addCustomChallenge(payload)
    setBusy(false)
    if (ok) onClose()
  }

  return (
    <Modal title={challenge || template ? 'Modifier le challenge' : 'Nouveau challenge'} icon={Flag} onClose={onClose}>
      <form className="space-y-4" onSubmit={submit} noValidate>
        {template && <Alert tone="info">Une copie du catalogue sera enregistrée dans « Mes challenges ».</Alert>}
        <Field label="Titre"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={60} autoFocus placeholder="Ex. Lecture quotidienne" /></Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Durée (jours)"><Input type="number" min="1" max="365" value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: e.target.value })} /></Field>
          <Field label="Couleur">
            <div className="flex min-h-11 items-center gap-2" role="radiogroup" aria-label="Couleur">
              {DOMAIN_COLORS.slice(0, 5).map((c) => (
                <button key={c} type="button" role="radio" aria-checked={form.color === c} aria-label={c} onClick={() => setForm({ ...form, color: c })}
                  className="size-8 rounded-full transition active:scale-90" style={{ backgroundColor: c, boxShadow: form.color === c ? `0 0 0 3px var(--surface), 0 0 0 5px ${c}` : undefined }} />
              ))}
            </div>
          </Field>
        </div>
        <Field label="Description" hint="Optionnel"><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={200} /></Field>

        <div className="space-y-2.5">
          <p className="text-sm font-medium text-fg">Tâches récurrentes</p>
          {blueprints.map((b, i) => (
            <div key={i} className="space-y-2 rounded-2xl border border-line bg-surface-2/50 p-3">
              <Input placeholder="Titre de la tâche" value={b.title} onChange={(e) => setBp(i, 'title', e.target.value)} maxLength={100} aria-label={`Titre de la tâche ${i + 1}`} />
              <div className="flex items-center gap-2">
                <Input placeholder="Durée (20min)" value={b.duration} onChange={(e) => setBp(i, 'duration', e.target.value)} maxLength={20} aria-label="Durée" />
                <Select value={b.frequency} onChange={(e) => setBp(i, 'frequency', e.target.value)} aria-label="Fréquence">{FREQ.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select>
                {blueprints.length > 1 && <IconButton icon={Trash2} variant="danger-soft" label="Retirer cette tâche" onClick={() => setBlueprints((l) => l.filter((_, idx) => idx !== i))} />}
              </div>
            </div>
          ))}
          <Button size="sm" variant="secondary" icon={Plus} onClick={() => setBlueprints((l) => [...l, { title: '', duration: '', frequency: 'daily' }])}>Ajouter une tâche</Button>
        </div>

        {error && <Alert tone="danger">{error}</Alert>}
        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button type="submit" loading={busy}>Enregistrer</Button>
        </div>
      </form>
    </Modal>
  )
}

function ActiveChallengeCard({ active, tasks, domains, today, onDelete }) {
  const p = challengeProgress(active, tasks)
  const totalDays = diffDays(active.start_date, active.end_date) + 1
  const elapsed = Math.min(totalDays, Math.max(0, diffDays(active.start_date, today) + 1))
  const remaining = Math.max(0, diffDays(today, active.end_date))
  const timePct = Math.round((elapsed / totalDays) * 100)
  const finished = today > active.end_date
  const notStarted = today < active.start_date
  const onTrack = p.pct >= timePct
  const own = tasks.filter((t) => t.challenge_active_id === active.id)
  const byDomain = domains.map((d) => {
    const t = own.filter((x) => x.domain_id === d.id)
    return { domain: d, done: t.filter((x) => x.done).length, total: t.length }
  }).filter((x) => x.total > 0)

  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <ProgressRing value={p.pct} size={64} stroke={6} tone={p.pct === 100 ? 'success' : 'brand'} />
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-fg">{active.title}</h2>
            <p className="text-sm text-muted">{formatShort(active.start_date)} → {formatShort(active.end_date)}</p>
            <div className="mt-1.5">
              {finished ? <Badge tone={p.pct === 100 ? 'success' : 'neutral'} icon={Trophy}>{p.pct === 100 ? 'Réussi' : 'Terminé'}</Badge>
                : notStarted ? <Badge tone="info" icon={CalendarClock}>Commence le {formatShort(active.start_date)}</Badge>
                : <Badge tone={onTrack ? 'success' : 'warning'}>{onTrack ? 'Dans les temps' : 'En retard sur le rythme'}</Badge>}
            </div>
          </div>
        </div>
        <Menu items={[{ label: 'Supprimer le challenge', icon: Trash2, danger: true, onClick: onDelete }]} />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { icon: ListChecks, value: `${p.done}/${p.total}`, label: 'Tâches faites' },
          { icon: Hourglass, value: finished ? '0' : notStarted ? totalDays : remaining, label: finished ? 'Jour restant' : 'Jours restants' },
          { icon: CalendarClock, value: `${elapsed}/${totalDays}`, label: 'Jours écoulés' },
        ].map(({ icon: Icon, value, label }) => (
          <div key={label} className="rounded-xl bg-surface-2 px-2 py-2.5">
            <Icon className="mx-auto mb-1 size-4 text-brand-600 dark:text-brand-300" aria-hidden />
            <p className="text-base font-bold tabular-nums text-fg">{value}</p>
            <p className="text-[11px] text-muted">{label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted"><span>Temps écoulé</span><span className="tabular-nums">{timePct} %</span></div>
        <ProgressBar value={timePct} size="sm" tone="info" />
      </div>

      {byDomain.length > 0 && (
        <div className="space-y-2.5 border-t border-line pt-3">
          {byDomain.map(({ domain, done, total }) => (
            <div key={domain.id} className="flex items-center gap-3">
              <DomainTile domain={domain} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex justify-between text-xs"><span className="truncate font-medium text-fg">{domain.name}</span><span className="tabular-nums text-muted">{done}/{total}</span></div>
                <ProgressBar value={(done / total) * 100} color={domain.color} size="sm" />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

export default function Challenges() {
  const { activeChallenges, customChallenges, tasks, domains, today, actions } = useData()
  const [starting, setStarting] = useState(null)
  const [customForm, setCustomForm] = useState(null)
  const [toStop, setToStop] = useState(null)
  const [toDelete, setToDelete] = useState(null)

  const asChallenge = (c) => ({ id: c.id, title: c.title, durationDays: c.durationDays ?? c.duration_days, color: c.color, blueprints: c.blueprints })
  const running = (id) => activeChallenges.some((a) => a.challenge_id === id && a.end_date >= today)

  const templateCard = (c, iconName, menu) => (
    <Card key={c.id} className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <DomainTile iconName={iconName} color={c.color} size="lg" />
          <div className="min-w-0"><h3 className="truncate text-base font-semibold text-fg">{c.title}</h3><p className="text-sm text-muted">{c.durationDays ?? c.duration_days} jours</p></div>
        </div>
        {menu}
      </div>
      {c.description && <p className="text-sm text-muted">{c.description}</p>}
      <ul className="space-y-1.5 text-sm text-fg">
        {c.blueprints.map((b, i) => (
          <li key={i} className="flex items-start gap-2"><ListChecks className="mt-0.5 size-4 shrink-0 text-subtle" aria-hidden /><span>{b.title}<span className="text-muted">{b.duration ? ` · ${b.duration}` : ''} · {FREQ_LABEL[b.frequency] ?? b.frequency}</span></span></li>
        ))}
      </ul>
      <Button className="mt-auto" icon={Play} variant={running(c.id) ? 'secondary' : 'primary'} disabled={running(c.id)} onClick={() => setStarting(asChallenge(c))}>
        {running(c.id) ? 'Déjà en cours' : 'Démarrer'}
      </Button>
    </Card>
  )

  return (
    <>
      <PageHeader title="Challenges" subtitle="Des séries de tâches planifiées sur plusieurs jours">
        <Button icon={Plus} onClick={() => setCustomForm({})}>Créer un challenge</Button>
      </PageHeader>

      <div className="space-y-8">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-fg">En cours</h2>
          {activeChallenges.length === 0 ? (
            <EmptyState icon={Flag} title="Aucun challenge actif">Choisissez-en un dans le catalogue ci-dessous pour remplir automatiquement votre planning.</EmptyState>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {activeChallenges.map((a) => <ActiveChallengeCard key={a.id} active={a} tasks={tasks} domains={domains} today={today} onDelete={() => setToStop(a)} />)}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-fg">Catalogue</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{CHALLENGE_CATALOGUE.map((c) => templateCard(c, c.icon, <Menu items={[{ label: 'Modifier', icon: Pencil, onClick: () => setCustomForm({ template: c }) }]} />))}</div>
        </section>

        {customChallenges.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-fg">Mes challenges</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {customChallenges.map((c) => templateCard(c, 'flag', <Menu items={[{ label: 'Modifier', icon: Pencil, onClick: () => setCustomForm({ challenge: c }) }, { label: 'Supprimer', icon: Trash2, danger: true, onClick: () => setToDelete(c) }]} />))}
            </div>
          </section>
        )}
      </div>

      {starting && <StartModal challenge={starting} onClose={() => setStarting(null)} />}
      {customForm && <CustomForm challenge={customForm.challenge} template={customForm.template} onClose={() => setCustomForm(null)} />}
      {toStop && (
        <ConfirmDialog title="Supprimer ce challenge ?" message="Toutes ses tâches (y compris celles déjà faites) seront supprimées." onCancel={() => setToStop(null)}
          onConfirm={async () => { await actions.stopChallenge(toStop.id); setToStop(null) }} />
      )}
      {toDelete && (
        <ConfirmDialog title="Supprimer ce modèle ?" message={`« ${toDelete.title} » sera supprimé. Les challenges déjà démarrés restent actifs.`} onCancel={() => setToDelete(null)}
          onConfirm={async () => { await actions.removeCustomChallenge(toDelete.id); setToDelete(null) }} />
      )}
    </>
  )
}
