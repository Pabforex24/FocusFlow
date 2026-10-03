import { useCallback, useState } from 'react'
import { Check, Layers, Pencil, Plus, Trash2 } from 'lucide-react'
import DomainTile from '../components/DomainTile.jsx'
import Modal from '../components/Modal.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx'
import { EmptyState } from '../components/ui/EmptyState.jsx'
import { Field, Input } from '../components/ui/Input.jsx'
import { Menu } from '../components/ui/Menu.jsx'
import { PageHeader } from '../components/ui/PageHeader.jsx'
import { ProgressBar } from '../components/ui/ProgressBar.jsx'
import { useData } from '../contexts/DataContext.jsx'
import { useOpenOnNew } from '../hooks/useOpenOnNew.js'
import { DOMAIN_COLORS, DOMAIN_ICON_KEYS, ICONS, resolveIcon } from '../lib/icons.js'
import { cn } from '../lib/cn.js'

function DomainForm({ domain, onClose }) {
  const { domains, actions } = useData()
  const [name, setName] = useState(domain?.name ?? '')
  const initialIcon = domain ? DOMAIN_ICON_KEYS.find((k) => ICONS[k] === resolveIcon(domain.icon)) ?? 'target' : 'target'
  const [icon, setIcon] = useState(initialIcon)
  const [color, setColor] = useState(domain?.color ?? DOMAIN_COLORS[0])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const clean = name.trim()
    if (!clean) return setError('Donnez un nom au domaine.')
    if (domains.some((d) => d.id !== domain?.id && d.name.toLowerCase() === clean.toLowerCase())) return setError('Un domaine porte déjà ce nom.')
    setError('')
    setBusy(true)
    const ok = domain ? await actions.editDomain(domain.id, { name: clean, icon, color }) : await actions.addDomain({ name: clean, icon, color })
    setBusy(false)
    if (ok) onClose()
  }

  return (
    <Modal title={domain ? 'Modifier le domaine' : 'Nouveau domaine'} icon={Layers} onClose={onClose}>
      <form className="space-y-5" onSubmit={submit} noValidate>
        <Field label="Nom" error={error}><Input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoFocus placeholder="Ex. Sport, Études, Trading…" /></Field>
        <Field label="Icône">
          <div className="grid grid-cols-8 gap-2" role="radiogroup" aria-label="Icône">
            {DOMAIN_ICON_KEYS.map((key) => {
              const Icon = ICONS[key]
              return (
                <button key={key} type="button" role="radio" aria-checked={icon === key} aria-label={key} onClick={() => setIcon(key)}
                  className={cn('grid aspect-square place-items-center rounded-xl border transition', icon === key ? 'border-transparent text-white' : 'border-line text-muted hover:bg-surface-2')}
                  style={icon === key ? { backgroundColor: color } : undefined}>
                  <Icon className="size-5" aria-hidden />
                </button>
              )
            })}
          </div>
        </Field>
        <Field label="Couleur">
          <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Couleur">
            {DOMAIN_COLORS.map((c) => (
              <button key={c} type="button" role="radio" aria-checked={color === c} aria-label={c} onClick={() => setColor(c)}
                className="grid size-9 place-items-center rounded-full text-white transition active:scale-90" style={{ backgroundColor: c, boxShadow: color === c ? `0 0 0 3px var(--surface), 0 0 0 5px ${c}` : undefined }}>
                {color === c && <Check className="size-4" strokeWidth={3} aria-hidden />}
              </button>
            ))}
          </div>
        </Field>
        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button type="submit" loading={busy}>Enregistrer</Button>
        </div>
      </form>
    </Modal>
  )
}

export default function Domains() {
  const { domains, goals, tasks, today, actions } = useData()
  const [form, setForm] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  useOpenOnNew(useCallback(() => setForm({}), []))

  return (
    <>
      <PageHeader title="Domaines" subtitle="Les grands pans de votre vie à faire progresser">
        <Button icon={Plus} onClick={() => setForm({})}>Nouveau domaine</Button>
      </PageHeader>

      {domains.length === 0 ? (
        <EmptyState icon={Layers} title="Aucun domaine" action={<Button icon={Plus} onClick={() => setForm({})}>Créer un domaine</Button>}>
          Créez votre premier domaine (Sport, Études, Travail…), puis ajoutez-y des objectifs et des tâches.
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {domains.map((d) => {
            const own = tasks.filter((t) => t.domain_id === d.id)
            const done = own.filter((t) => t.done).length
            const pct = own.length ? Math.round((done / own.length) * 100) : 0
            const todayTasks = own.filter((t) => t.scheduled_on === today)
            const goalCount = goals.filter((g) => g.domain_id === d.id).length
            return (
              <Card key={d.id} className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <DomainTile domain={d} size="lg" />
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold text-fg">{d.name}</h2>
                      <p className="text-sm text-muted">{goalCount} objectif{goalCount > 1 ? 's' : ''} · {own.length} tâche{own.length > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <Menu items={[{ label: 'Modifier', icon: Pencil, onClick: () => setForm({ domain: d }) }, { label: 'Supprimer', icon: Trash2, danger: true, onClick: () => setToDelete(d) }]} />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm"><span className="text-muted">Progression</span><span className="font-semibold tabular-nums text-fg">{pct} %</span></div>
                  <ProgressBar value={pct} color={d.color} />
                </div>
                <p className="text-xs text-subtle">Aujourd'hui : {todayTasks.filter((t) => t.done).length}/{todayTasks.length} tâches</p>
              </Card>
            )
          })}
        </div>
      )}

      {form && <DomainForm domain={form.domain} onClose={() => setForm(null)} />}
      {toDelete && (
        <ConfirmDialog title="Supprimer le domaine ?" message={`« ${toDelete.name} » et ses objectifs seront supprimés. Les tâches associées sont conservées, sans domaine.`}
          onConfirm={async () => { await actions.removeDomain(toDelete.id); setToDelete(null) }} onCancel={() => setToDelete(null)} />
      )}
    </>
  )
}
