import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Flag, ListChecks, Users } from 'lucide-react'
import Modal from '../Modal.jsx'
import { Alert } from '../ui/Alert.jsx'
import { Button } from '../ui/Button.jsx'
import { Field, Input, Select } from '../ui/Input.jsx'
import { useData } from '../../contexts/DataContext.jsx'
import { CHALLENGE_CATALOGUE, buildChallengeTasks } from '../../lib/challenges.js'
import { addDays, diffDays, formatShort } from '../../lib/dates.js'

const sourceValue = (prefix, challenge) => `${prefix}:${challenge.id}`
const sourceDays = (challenge) => challenge.durationDays ?? challenge.duration_days ?? 30

export default function SharedChallengeForm({ onClose }) {
  const { domains, customChallenges, today, actions } = useData()
  const sources = [
    ...CHALLENGE_CATALOGUE.map((challenge) => ({ value: sourceValue('catalogue', challenge), challenge })),
    ...customChallenges.map((challenge) => ({ value: sourceValue('custom', challenge), challenge })),
  ]
  const [sourceKey, setSourceKey] = useState(sources[0]?.value ?? '')
  const source = sources.find((item) => item.value === sourceKey)?.challenge ?? sources[0]?.challenge
  const [startKey, setStartKey] = useState(today)
  const [days, setDays] = useState(String(sourceDays(source)))
  const [domainId, setDomainId] = useState(domains[0]?.id ?? '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (domains.length === 0) {
    return (
      <Modal title="Créer un défi avec des amis" icon={Users} onClose={onClose}>
        <p className="text-sm text-muted">Créez d'abord un domaine pour y ranger les tâches du défi.</p>
        <Link to="/domains?new=1" className="mt-5 inline-flex h-11 items-center rounded-xl btn-brand px-4 text-sm font-semibold">Créer un domaine</Link>
      </Modal>
    )
  }

  const duration = Math.floor(Number(days) || 0)
  const endKey = startKey ? addDays(startKey, Math.max(1, duration) - 1) : ''
  const taskCount = source && startKey && endKey
    ? buildChallengeTasks({ blueprints: source.blueprints ?? [], startKey, endKey, domainId }).length
    : 0
  const tooManyBlueprints = (source?.blueprints?.length ?? 0) > 30
  const invalid = !source || !startKey || startKey < today || duration < 1 || duration > 365 || endKey < startKey || !domainId || taskCount === 0 || taskCount > 5000 || tooManyBlueprints

  const changeSource = (value) => {
    setSourceKey(value)
    const next = sources.find((item) => item.value === value)?.challenge
    if (next) setDays(String(sourceDays(next)))
  }

  const submit = async (event) => {
    event.preventDefault()
    if (invalid) return
    setError('')
    setBusy(true)
    const group = {
      title: source.title,
      description: source.description ?? '',
      color: source.color,
      icon: source.icon ?? 'flag',
      duration_days: duration,
      start_date: startKey,
      end_date: endKey,
      blueprints: source.blueprints,
    }
    const ok = await actions.createSharedChallenge({ group, domainId })
    setBusy(false)
    if (ok) onClose()
    else setError('Le défi n\'a pas pu être créé.')
  }

  return (
    <Modal title="Créer un défi avec des amis" icon={Users} size="lg" onClose={onClose}>
      <form className="space-y-4" onSubmit={submit} noValidate>
        <Alert tone="info" title="Même programme, progressions séparées">
          Chaque membre reçoit les mêmes tâches aux mêmes dates, mais coche uniquement les siennes.
          Le classement compare les progressions sans exposer les tâches des autres.
        </Alert>

        <Field label="Programme" hint={customChallenges.length === 0 ? 'Créez un défi perso pour utiliser votre propre programme.' : undefined}>
          <Select value={sourceKey} onChange={(event) => changeSource(event.target.value)}>
            {sources.map((item) => <option key={item.value} value={item.value}>{item.challenge.title}</option>)}
          </Select>
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Date de début" error={startKey && startKey < today ? 'La date ne peut pas être passée.' : undefined}>
            <Input type="date" min={today} value={startKey} onChange={(event) => setStartKey(event.target.value)} />
          </Field>
          <Field label="Durée (jours)" hint="De 1 à 365">
            <Input type="number" min="1" max="365" value={days} onChange={(event) => setDays(event.target.value)} />
          </Field>
        </div>

        <p className="text-xs text-subtle">
          {!startKey ? 'Choisissez une date de début.' : duration < 1 || duration > 365 ? 'Choisissez une durée entre 1 et 365 jours.' : tooManyBlueprints ? 'Ce programme contient trop de tâches différentes (30 maximum).' : taskCount === 0 ? 'Aucune tâche ne tombe dans cette période. Ajustez la date ou la durée.' : taskCount > 5000 ? 'Ce programme génère plus de 5 000 tâches. Réduisez la durée.' : `Du ${formatShort(startKey)} au ${formatShort(endKey)} · ${diffDays(startKey, endKey) + 1} jours.`}
        </p>

        <Field label="Domaine des tâches">
          <Select value={domainId} onChange={(event) => setDomainId(event.target.value)}>
            {domains.map((domain) => <option key={domain.id} value={domain.id}>{domain.name}</option>)}
          </Select>
        </Field>

        {source && (
          <div className="rounded-2xl border border-line bg-surface-2/50 p-3">
            <p className="mb-2 flex items-center gap-2 text-sm font-medium text-fg"><ListChecks className="size-4 text-brand-600 dark:text-brand-300" aria-hidden />Programme commun</p>
            <ul className="space-y-1.5 text-sm text-muted">
              {source.blueprints.map((blueprint, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Flag className="mt-0.5 size-3.5 shrink-0 text-subtle" aria-hidden />
                  <span>{blueprint.title}{blueprint.duration ? ` · ${blueprint.duration}` : ''}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && <Alert tone="danger">{error}</Alert>}
        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button type="submit" loading={busy} disabled={invalid} icon={Users}>Créer le défi</Button>
        </div>
      </form>
    </Modal>
  )
}
