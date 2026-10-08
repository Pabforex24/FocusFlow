import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Compass, Flame, NotebookPen, Rocket, ShieldCheck, Sparkles, Target, Timer, TrendingUp, TriangleAlert, Trophy } from 'lucide-react'
import { Alert } from '../components/ui/Alert.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { PageHeader } from '../components/ui/PageHeader.jsx'
import { useData } from '../contexts/DataContext.jsx'
import { buildCoachContext } from '../lib/coachContext.js'
import { toUserMessage } from '../lib/errors.js'
import { goalProgress, lastDays } from '../lib/stats.js'
import { askCoach } from '../services/coachApi.js'
import { cn } from '../lib/cn.js'

const TONES = {
  brand: 'bg-brand-500/10 text-brand-600 dark:text-brand-300',
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  warning: 'bg-amber-500/12 text-amber-600 dark:text-amber-400',
  info: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
}

// Cache du conseil IA : une génération par jour suffit, réaffichée instantanément.
const AI_CACHE_KEY = 'focusflow-coach-ai'

// Coach local : conseils calculés à partir de vos données, sans service externe,
// affichés immédiatement. L'analyse IA (Groq via /api/coach) se déclenche à la demande.
function buildInsights({ tasks, goals, stats, today, restDays }) {
  const out = []
  const todayTasks = tasks.filter((t) => t.scheduled_on === today)
  const left = todayTasks.filter((t) => !t.done)
  const week = lastDays(tasks, today)
  const weekTotal = week.reduce((n, d) => n + d.total, 0)
  const weekDone = week.reduce((n, d) => n + d.done, 0)
  const weekRate = weekTotal ? Math.round((weekDone / weekTotal) * 100) : null

  if (tasks.length === 0) return [{ icon: Rocket, tone: 'brand', title: 'Commencez petit', text: "Ajoutez une seule tâche pour aujourd'hui. La régularité se construit jour après jour." }]

  if (todayTasks.length === 0) out.push({ icon: NotebookPen, tone: 'info', title: 'Journée vide', text: "Aucune tâche prévue aujourd'hui. Planifiez une action simple de 10 minutes pour garder la série." })
  else if (left.length === 0) out.push({ icon: Trophy, tone: 'success', title: 'Journée parfaite', text: 'Toutes vos tâches du jour sont faites. Profitez-en, ou avancez sur celles de demain.' })
  else out.push({ icon: Timer, tone: 'brand', title: `Il reste ${left.length} tâche${left.length > 1 ? 's' : ''}`, text: `Commencez par « ${left.find((t) => t.priority === 'high')?.title ?? left[0].title} » avec une session Focus de 25 minutes.` })

  if (stats.streak >= 3) out.push({ icon: Flame, tone: 'warning', title: `Série de ${stats.streak} jours`, text: 'Ne cassez pas la chaîne : même une petite tâche compte.' })
  else if (stats.longestStreak > stats.streak && stats.longestStreak >= 3) out.push({ icon: Flame, tone: 'warning', title: 'Reprenez votre élan', text: `Votre record est de ${stats.longestStreak} jours. Vous pouvez le battre.` })

  if (weekRate !== null) out.push({ icon: weekRate >= 70 ? TrendingUp : Compass, tone: weekRate >= 70 ? 'success' : 'info', title: `${weekRate} % sur 7 jours`, text: weekRate >= 70 ? 'Très bon rythme. Gardez la même charge.' : 'Essayez de planifier moins de tâches, mais de les terminer toutes.' })

  const late = goals.filter((g) => g.deadline && g.deadline < today && goalProgress(g, tasks).pct < 100)
  if (late.length) out.push({ icon: Target, tone: 'warning', title: 'Objectif en retard', text: `« ${late[0].title} » a dépassé son échéance. Révisez-la ou découpez-le en petites tâches.` })
  if (stats.missedDays >= 3) out.push({ icon: TriangleAlert, tone: 'warning', title: 'Jours manqués', text: `${stats.missedDays} jours sans tâche faite. Pensez à déclarer un imprévu quand la journée est compromise.` })
  if (restDays.length === 0 && stats.streak >= 5) out.push({ icon: ShieldCheck, tone: 'info', title: 'Protégez votre série', text: 'Un imprévu par semaine peut sauver votre série un jour difficile.' })
  return out
}

export default function Coach() {
  const data = useData()
  const [main, ...others] = buildInsights(data)
  const MainIcon = main.icon
  const [ai, setAi] = useState({ text: null, at: null, loading: false, error: null })

  // Recharge le conseil du jour depuis le cache local s'il est encore d'actualité.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(AI_CACHE_KEY))
      if (saved?.day === data.today && saved.text) setAi((s) => ({ ...s, text: saved.text, at: saved.at }))
    } catch {
      // Cache absent ou illisible : on repart sans conseil en cache.
    }
  }, [data.today])

  const runAi = async () => {
    setAi((s) => ({ ...s, loading: true, error: null }))
    try {
      const text = await askCoach(buildCoachContext(data))
      const at = Date.now()
      setAi({ text, at, loading: false, error: null })
      try {
        localStorage.setItem(AI_CACHE_KEY, JSON.stringify({ day: data.today, text, at }))
      } catch {
        // Stockage plein ou indisponible : le conseil reste affiché pour la session.
      }
    } catch (error) {
      // En cas d'échec, le conseil précédent (et les conseils locaux) restent affichés.
      setAi((s) => ({ ...s, loading: false, error: toUserMessage(error) }))
    }
  }

  return (
    <>
      <PageHeader title="Coach" subtitle="Conseils locaux et analyse IA personnalisée" />
      <div className="space-y-4">
        <section className="relative overflow-hidden rounded-3xl hero-surface p-5 text-white shadow-pop sm:p-6">
          <div className="pointer-events-none absolute -right-10 -bottom-10 size-44 rounded-full bg-white/10 blur-2xl" aria-hidden />
          <div className="relative flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/15"><MainIcon className="size-6" aria-hidden /></span>
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-white/70 uppercase"><Sparkles className="size-3.5" aria-hidden />Conseil du jour</p>
              <h2 className="mt-1 text-xl font-bold">{main.title}</h2>
              <p className="mt-1 text-sm text-white/85">{main.text}</p>
            </div>
          </div>
        </section>

        <section aria-labelledby="coach-ai-title" className="rounded-3xl border border-line bg-surface p-5 shadow-xs dark:bg-white/5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-300"><Sparkles className="size-5" aria-hidden /></span>
            <div className="min-w-0 flex-1 basis-44">
              <h2 id="coach-ai-title" className="text-sm font-semibold text-fg">Coach IA</h2>
              <p className="text-xs text-muted">Analyse personnalisée sur demande</p>
            </div>
            <Button variant="secondary" size="sm" icon={Sparkles} loading={ai.loading} onClick={runAi}>
              {ai.text ? 'Régénérer' : 'Analyser'}
            </Button>
          </div>
          {ai.error && <Alert tone="warning" className="mt-3">{ai.error}</Alert>}
          <div className="mt-3">
            {ai.loading ? (
              <p className="text-sm text-muted">Le coach analyse ta semaine…</p>
            ) : ai.text ? (
              <p className="whitespace-pre-line text-sm leading-relaxed text-fg">{ai.text}</p>
            ) : !ai.error ? (
              <p className="text-sm text-muted">Le coach croise ton série, ta semaine et tes objectifs pour un conseil concret.</p>
            ) : null}
            {ai.at && !ai.loading && (
              <p className="mt-2 text-xs text-muted">
                Généré à {new Date(ai.at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                {' — '}
                {ai.text ? 'une régénération remplacera ce conseil.' : 'relance l\'analyse pour en obtenir un nouveau.'}
              </p>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {others.map((i) => (
            <Card key={i.title} className="flex items-start gap-3.5">
              <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl', TONES[i.tone])}><i.icon className="size-5" aria-hidden /></span>
              <div><h3 className="text-sm font-semibold text-fg">{i.title}</h3><p className="mt-0.5 text-sm text-muted">{i.text}</p></div>
            </Card>
          ))}
        </div>
        <p className="text-center text-sm text-muted">Prêt à agir ? <Link to="/tasks" className="font-medium text-brand-600 hover:underline dark:text-brand-300">Planifiez votre journée</Link></p>
      </div>
    </>
  )
}
