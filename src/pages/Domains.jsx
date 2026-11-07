import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ChevronRight, Layers, Pencil, Plus, Trash2 } from 'lucide-react'
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
          <div className="grid max-h-52 grid-cols-8 gap-2 overflow-y-auto" role="radiogroup" aria-label="Icône">
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
  const { domains, tasks, today, actions } = useData()
  const [form, setForm] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  useOpenOnNew(useCallback(() => setForm({}), []))

  return (
    <>
      <PageHeader title="Domaines">
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
            const todayOpen = own.filter((t) => !t.done && t.scheduled_on === today).length
            const overdue = own.filter((t) => !t.done && t.scheduled_on < today).length
            const summary = overdue > 0 ? `${overdue} tâche${overdue > 1 ? 's' : ''} en retard` : todayOpen > 0 ? `${todayOpen} tâche${todayOpen > 1 ? 's' : ''} aujourd'hui` : 'À jour'
            return (
              <Card key={d.id} className="group relative overflow-hidden transition duration-300 hover:border-brand-400/40 hover:shadow-pop">
                <span aria-hidden className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: d.color }} />
                <Link to={`/domains/${d.id}`} className="block space-y-4 rounded-xl pr-9 outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface">
                  <div className="flex min-w-0 items-center gap-3">
                    <DomainTile domain={d} size="lg" />
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-base font-semibold text-fg">{d.name}</h2>
                      <p className={cn('text-sm', overdue ? 'font-medium text-rose-600 dark:text-rose-400' : 'text-muted')}>{summary}</p>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-subtle transition group-hover:translate-x-0.5" aria-hidden />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs"><span className="text-muted">{done}/{own.length} tâches terminées</span><span className="font-semibold tabular-nums text-fg">{pct} %</span></div>
                    <ProgressBar value={pct} color={d.color} tone={pct === 100 ? 'success' : 'brand'} />
                  </div>
                </Link>
                <div className="absolute top-2.5 right-2.5">
                  <Menu items={[{ label: 'Modifier', icon: Pencil, onClick: () => setForm({ domain: d }) }, { label: 'Supprimer', icon: Trash2, danger: true, onClick: () => setToDelete(d) }]} label={`Actions pour ${d.name}`} />
                </div>
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
