import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CalendarClock, Flag, LogIn, Users } from 'lucide-react'
import DomainTile from '../components/DomainTile.jsx'
import { Alert } from '../components/ui/Alert.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { Field, Select } from '../components/ui/Input.jsx'
import { PageHeader } from '../components/ui/PageHeader.jsx'
import { Spinner } from '../components/ui/LoadingState.jsx'
import { useData } from '../contexts/DataContext.jsx'
import { formatShort } from '../lib/dates.js'
import { toUserMessage } from '../lib/errors.js'
import { sharedChallengeCanJoin, sharedChallengeStatus } from '../lib/sharedChallenges.js'

const statusLabel = (status, group) => {
  if (status === 'archived') return 'Défi archivé'
  if (status === 'upcoming') return `Commence le ${formatShort(group.start_date)}`
  if (status === 'finished') return 'Défi terminé'
  return 'Défi en cours'
}

export default function JoinSharedChallenge() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { domains, today, actions } = useData()
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [domainId, setDomainId] = useState(domains[0]?.id ?? '')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    actions.getSharedChallengePreview(code)
      .then((data) => {
        if (!active) return
        if (!data?.group) setError('Invitation introuvable ou expirée.')
        else setPreview(data)
      })
      .catch((err) => { if (active) setError(toUserMessage(err)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [actions, code])

  useEffect(() => {
    if (!domainId && domains[0]) setDomainId(domains[0].id)
  }, [domainId, domains])

  const group = preview?.group
  const status = group ? sharedChallengeStatus(group, today) : null
  const canJoin = group ? sharedChallengeCanJoin(group, today) : false

  const join = async () => {
    if (!group || !domainId) return
    setBusy(true)
    const ok = await actions.joinSharedChallenge({ code, group, domainId })
    setBusy(false)
    if (ok) navigate('/challenges', { replace: true })
  }

  return (
    <>
      <PageHeader title="Rejoindre un défi partagé" subtitle="Même programme que le groupe, progression personnelle." />
      <div className="mx-auto max-w-2xl space-y-4">
        {loading && <div className="grid place-items-center rounded-2xl border border-line bg-surface p-10"><Spinner className="size-7" /></div>}

        {!loading && error && (
          <Alert tone="danger" title="Impossible de rejoindre ce défi">{error}</Alert>
        )}

        {!loading && !error && group && (
          <>
            <Card className="space-y-4">
              <div className="flex items-start gap-3">
                <DomainTile iconName={group.icon} color={group.color} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h2 className="truncate text-lg font-semibold text-fg">{group.title}</h2>
                    <Badge tone={status === 'upcoming' ? 'info' : status === 'active' ? 'success' : 'neutral'}>{statusLabel(status, group)}</Badge>
                  </div>
                  <p className="text-sm text-muted">Organisé par {preview.ownerName}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                    <span className="inline-flex items-center gap-1"><CalendarClock className="size-3.5" aria-hidden />{formatShort(group.start_date)} → {formatShort(group.end_date)}</span>
                    <span className="inline-flex items-center gap-1"><Users className="size-3.5" aria-hidden />{preview.memberCount} participant{preview.memberCount > 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>

              {group.description && <p className="text-sm text-muted">{group.description}</p>}

              <div className="rounded-2xl border border-line bg-surface-2/50 p-3">
                <p className="mb-2 flex items-center gap-2 text-sm font-medium text-fg"><Flag className="size-4 text-brand-600 dark:text-brand-300" aria-hidden />Programme commun</p>
                <ul className="space-y-1.5 text-sm text-muted">
                  {group.blueprints.map((blueprint, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Flag className="mt-0.5 size-3.5 shrink-0 text-subtle" aria-hidden />
                      <span>{blueprint.title}{blueprint.duration ? ` · ${blueprint.duration}` : ''}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>

            {preview.alreadyMember ? (
              <Alert tone="success" title="Vous participez déjà à ce défi" action={<Link to="/challenges" className="inline-flex h-10 items-center rounded-xl btn-brand px-4 text-sm font-semibold">Voir mes défis</Link>}>
                Votre progression et vos tâches sont déjà dans votre planning.
              </Alert>
            ) : !canJoin ? (
              <Alert tone="warning" title="Les inscriptions sont fermées">
                Ce défi a déjà commencé ou a été archivé. Demandez à l'organisateur de créer un nouveau défi.
              </Alert>
            ) : domains.length === 0 ? (
              <Alert tone="warning" title="Créez d'abord un domaine" action={<Link to="/domains?new=1" className="inline-flex h-10 items-center rounded-xl btn-brand px-4 text-sm font-semibold">Créer un domaine</Link>}>
                Les tâches du défi seront rangées dans l'un de vos domaines.
              </Alert>
            ) : (
              <Card className="space-y-4">
                <p className="text-sm text-muted">Choisissez le domaine qui recevra vos tâches personnelles. Les autres membres ne verront jamais vos tâches.</p>
                <Field label="Domaine des tâches">
                  <Select value={domainId} onChange={(event) => setDomainId(event.target.value)}>
                    {domains.map((domain) => <option key={domain.id} value={domain.id}>{domain.name}</option>)}
                  </Select>
                </Field>
                <Button className="w-full" icon={LogIn} loading={busy} disabled={!domainId} onClick={join}>Rejoindre le défi</Button>
              </Card>
            )}
          </>
        )}

        {!loading && !error && !group && (
          <Alert tone="danger" title="Invitation introuvable">Le lien est peut-être incomplet ou le défi a été supprimé.</Alert>
        )}

        <p className="text-center text-xs text-subtle"><Link to="/challenges" className="font-medium text-brand-600 hover:underline dark:text-brand-300">Retour aux challenges</Link></p>
      </div>
    </>
  )
}
