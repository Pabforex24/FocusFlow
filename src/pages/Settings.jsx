import { useState } from 'react'
import { Bell, Check, LogOut, Monitor, Moon, Palette, Pause, RefreshCw, ShieldAlert, Sun, Trash2 } from 'lucide-react'
import { Alert } from '../components/ui/Alert.jsx'
import { Button, IconButton } from '../components/ui/Button.jsx'
import { Card, CardHeader } from '../components/ui/Card.jsx'
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx'
import { Field, Input } from '../components/ui/Input.jsx'
import { PageHeader } from '../components/ui/PageHeader.jsx'
import { Segmented } from '../components/ui/Segmented.jsx'
import { Switch } from '../components/ui/Switch.jsx'
import { useSignOut } from '../components/Layout.jsx'
import { useData } from '../contexts/DataContext.jsx'
import { useTheme } from '../contexts/ThemeContext.jsx'
import { useToast } from '../contexts/ToastContext.jsx'
import { usePushNotifications } from '../hooks/usePushNotifications.js'
import { sendTestPush } from '../services/api.js'
import { showTestNotification } from '../lib/focusNotify.js'
import { toUserMessage } from '../lib/errors.js'
import { formatShort } from '../lib/dates.js'
import { cn } from '../lib/cn.js'

// Heures proposées pour le rappel quotidien (heure locale).
const REMIND_HOURS = Array.from({ length: 18 }, (_, i) => i + 6)

// Aperçu fixe de chaque palette (indépendant de la palette active).
const PALETTE_CHOICES = [
  { value: 'foret', label: 'Forêt', hint: 'Vert profond · nature', swatch: 'linear-gradient(135deg, #275d46 0%, #0a1512 70%, #050808 100%)', accent: '#6fcfa4' },
  { value: 'walnut', label: 'Walnut', hint: 'Brun noyer · chaleureux', swatch: 'linear-gradient(135deg, #5e4b43 0%, #2e1f1b 55%, #0a0605 100%)', accent: '#c9a58c' },
  { value: 'charcoal', label: 'Royal Charcoal', hint: 'Graphite argent · sobre', swatch: 'linear-gradient(135deg, #4c4e51 0%, #1e2023 55%, #0e0f11 100%)', accent: '#c8ccd4' },
  { value: 'navy', label: 'Navy Mirage', hint: 'Bleu marine · nocturne', swatch: 'linear-gradient(135deg, #35577d 0%, #141e30 55%, #070d16 100%)', accent: '#9dbbe0' },
  { value: 'amethyst', label: 'Améthyste', hint: 'Violet lumineux · créatif', swatch: 'linear-gradient(135deg, #7c3aed 0%, #2e1065 55%, #0b0613 100%)', accent: '#c084fc' },
  { value: 'sunset', label: 'Coucher de soleil', hint: 'Corail et ambre · chaud', swatch: 'linear-gradient(135deg, #fb923c 0%, #9f1239 55%, #120806 100%)', accent: '#fdba74' },
  { value: 'ocean', label: 'Océan', hint: 'Turquoise profond · frais', swatch: 'linear-gradient(135deg, #0d9488 0%, #164e63 55%, #04100f 100%)', accent: '#5eead4' },
  { value: 'gold', label: 'Noir Doré', hint: 'Or et encre · luxueux', swatch: 'linear-gradient(135deg, #d4af37 0%, #4a3410 52%, #080704 100%)', accent: '#eacb6a' },
]

function PauseCard() {
  const { pausePeriods, today, actions } = useData()
  const [start, setStart] = useState(today)
  const [end, setEnd] = useState(today)
  const [label, setLabel] = useState('')
  const [busy, setBusy] = useState(false)

  const save = async () => {
    if (end < start) return
    setBusy(true)
    const ok = await actions.addPause({ start_date: start, end_date: end, label })
    setBusy(false)
    if (ok) { setLabel(''); setStart(today); setEnd(today) }
  }

  return (
    <Card className="space-y-4">
      <CardHeader title="Pauses · indisponibilité" description="Les jours couverts ne comptent pas (ni pénalité, ni série perdue) et décalent la fin des défis en cours." />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Du"><Input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></Field>
        <Field label="Au"><Input type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} /></Field>
      </div>
      <Field label="Motif" hint="Optionnel"><Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Vacances, maladie…" /></Field>
      <Button icon={Pause} onClick={save} disabled={busy || end < start}>Enregistrer la pause</Button>
      {pausePeriods.length > 0 && (
        <ul className="space-y-2 border-t border-line pt-3">
          {pausePeriods.map((p) => (
            <li key={p.id} className="flex items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400"><Pause className="size-4" aria-hidden /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-fg">{formatShort(p.start_date)} → {formatShort(p.end_date)}</p>
                {p.label && <p className="truncate text-xs text-muted">{p.label}</p>}
              </div>
              <IconButton icon={Trash2} label="Supprimer la pause" variant="danger-soft" size="sm" onClick={() => actions.removePause(p.id)} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export default function Settings() {
  const { profile, actions } = useData()
  const { preference, resolved, setTheme, palette, setPalette } = useTheme()
  const signOut = useSignOut()
  const [confirmLogout, setConfirmLogout] = useState(false)
  const push = usePushNotifications()
  const toast = useToast()
  const hardcore = profile?.hardcore_mode ?? false
  const currentPalette = PALETTE_CHOICES.find((choice) => choice.value === palette) ?? PALETTE_CHOICES[0]
  const modeLabel = resolved === 'dark' ? 'Sombre' : 'Clair'
  const logout = async () => { await signOut(); setConfirmLogout(false) }

  const testNotify = async () => {
    const local = await showTestNotification()
    try {
      const res = await sendTestPush()
      if (res.ok) toast.success(`Push de test envoyé (${res.sent}/${res.total} appareil${res.total > 1 ? 's' : ''}).`)
      else if (res.reason === 'no-subscription') toast.error('Aucun appareil abonné : active d\'abord le rappel ci-dessus.')
      else toast.error('Envoi push refusé — vérifie les clés VAPID côté serveur.')
    } catch (error) {
      toast.error(local ? 'Notification locale OK, mais l\'envoi serveur a échoué.' : toUserMessage(error))
    }
  }

  return (
    <>
      <PageHeader title="Réglages" subtitle="Apparence, notifications et confidentialité de ton espace." />
      <div className="mx-auto max-w-2xl space-y-4">
        <Card>
          <CardHeader icon={Palette} title="Apparence" description="Choisissez le mode et une ambiance. Chaque palette adapte les couleurs, les halos et les fonds." />
          <div className="space-y-5">
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p className="text-sm font-medium text-fg">Mode d'affichage</p>
                <p className="text-xs text-subtle">Auto suit le réglage de votre appareil.</p>
              </div>
              <Segmented fill value={preference} onChange={setTheme} options={[{ value: 'light', label: 'Clair', icon: Sun }, { value: 'dark', label: 'Sombre', icon: Moon }, { value: 'system', label: 'Auto', icon: Monitor }]} />
            </div>

            <div className="border-t border-line pt-4">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-fg">Palette de couleurs</p>
                  <p className="text-xs text-subtle">8 ambiances · clair et sombre</p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-semibold text-muted">
                  <span className="size-1.5 rounded-full bg-brand-500" aria-hidden />
                  {currentPalette.label} · {modeLabel}
                </span>
              </div>
              <div role="radiogroup" aria-label="Palette de couleurs" className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {PALETTE_CHOICES.map(({ value, label, hint, swatch, accent }) => {
                  const selected = palette === value
                  return (
                    <button key={value} type="button" role="radio" aria-checked={selected} onClick={() => setPalette(value)}
                      className={cn('group relative flex flex-col gap-2.5 rounded-2xl border p-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 active:scale-[0.99]',
                        selected ? 'border-brand-500 bg-brand-500/8 ring-2 ring-brand-500/25' : 'border-line bg-surface-2/40 hover:border-brand-500/40 hover:bg-surface-2/70')}>
                      <span className="relative block aspect-[16/10] w-full overflow-hidden rounded-xl border border-white/10"
                        style={{ backgroundImage: `radial-gradient(120% 110% at 18% 0%, ${accent}55, transparent 55%), ${swatch}` }} aria-hidden>
                        <span className="absolute left-2 top-2 h-1.5 w-8 rounded-full bg-white/35" />
                        <span className="absolute inset-x-2 bottom-2 h-6 rounded-md border border-white/15 bg-white/10 backdrop-blur-sm" />
                        {!selected && <span className="absolute right-2 top-2 size-2.5 rounded-full" style={{ backgroundColor: accent, boxShadow: `0 0 12px ${accent}99` }} />}
                      </span>
                      <span className="min-w-0 px-0.5 pb-0.5">
                        <span className="block truncate text-[13px] font-semibold text-fg sm:text-sm">{label}</span>
                        <span className="block truncate text-[11px] text-muted sm:text-xs">{hint}</span>
                      </span>
                      {selected && <span className="absolute right-3 top-3 grid size-5 place-items-center rounded-full bg-brand-500 text-brand-950 shadow-sm"><Check className="size-3" strokeWidth={3} aria-hidden /></span>}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Notifications" description="Rappel quotidien et alerte de série" />
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-300"><Bell className="size-5" aria-hidden /></span>
              <div><p className="text-sm font-semibold text-fg">Rappel quotidien</p><p className="text-sm text-muted">À l'heure choisie, plus une alerte le soir si votre série est en danger.</p></div>
            </div>
            <Switch checked={push.enabled} onChange={push.toggle} disabled={push.busy || !push.supported} label="Rappel quotidien" />
          </div>
          {push.enabled && (
            <label className="mt-4 flex items-center justify-between gap-4 rounded-xl bg-surface-2 px-3.5 py-2.5">
              <span className="text-sm font-medium text-fg">Heure du rappel</span>
              <select value={push.hour} onChange={(e) => push.setHour(e.target.value)} disabled={push.busy}
                className="h-11 rounded-xl border border-line bg-surface px-3 text-sm font-medium text-fg">
                {REMIND_HOURS.map((h) => <option key={h} value={h}>{h} h 00</option>)}
              </select>
            </label>
          )}
          <div className="mt-4 flex items-center justify-between gap-4">
            <p className="text-sm text-muted">Vérifier que cet appareil affiche bien les notifications.</p>
            <Button variant="secondary" icon={Bell} onClick={testNotify}>Tester</Button>
          </div>
          {push.braveHint && !push.enabled && <Alert tone="warning">Brave désactive les notifications push par défaut. Ouvrez <code className="rounded bg-surface-2 px-1 py-0.5 text-xs">brave://settings/privacy</code> et activez « Use Google services for push messaging », puis réactivez le rappel.</Alert>}
          {push.denied && <Alert tone="warning">Notifications bloquées par le navigateur. Autorisez-les dans les réglages du site, puis réactivez le rappel.</Alert>}
          {!push.supported && <Alert tone="info">Ce navigateur ne prend pas en charge les notifications.</Alert>}
          {push.iosHint && push.enabled && <Alert tone="info">Sur iPhone : Partager → « Ajouter à l'écran d'accueil » pour recevoir les notifications.</Alert>}
        </Card>

        <Card className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400"><ShieldAlert className="size-5" aria-hidden /></span>
            <div><p className="text-sm font-semibold text-fg">Mode Hardcore</p><p className="text-sm text-muted">Un jour sans tâche faite coûte −30 XP au lieu de −15.</p></div>
          </div>
          <Switch checked={hardcore} onChange={actions.setHardcore} label="Mode Hardcore" />
        </Card>

        <PauseCard />

        <Card className="flex items-center justify-between gap-4">
          <div><p className="text-sm font-semibold text-fg">Actualiser les données</p><p className="text-sm text-muted">Recharge tout depuis le serveur.</p></div>
          <Button variant="secondary" icon={RefreshCw} onClick={() => actions.refresh()}>Actualiser</Button>
        </Card>

        <Button variant="danger-soft" className="w-full border border-rose-500/30" icon={LogOut} onClick={() => setConfirmLogout(true)}>Se déconnecter</Button>
      </div>

      {confirmLogout && (
        <ConfirmDialog title="Se déconnecter ?" message="Voulez-vous vraiment vous déconnecter ?"
          confirmLabel="Se déconnecter" onConfirm={logout} onCancel={() => setConfirmLogout(false)} />
      )}
    </>
  )
}
