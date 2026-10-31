import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles, Target, Timer, TrendingUp } from 'lucide-react'
import Logo from '../components/layout/Logo.jsx'
import { cn } from '../lib/cn.js'

const HERO_FEATURES = [
  { icon: Target, title: 'Objectifs en actions', text: 'Chaque ambition devient une tâche concrète.' },
  { icon: Timer, title: 'Concentration protégée', text: 'Des sessions de focus sans distraction.' },
  { icon: TrendingUp, title: 'Progrès visibles', text: 'Séries, niveaux et statistiques clairs.' },
]

const PILLARS = [
  { icon: Target, title: 'Clarifiez', text: 'Décomposez vos objectifs en tâches réalistes, planifiées au bon moment.' },
  { icon: Timer, title: 'Concentrez-vous', text: 'Lancez une session de focus, coupez le bruit et avancez sur l\'essentiel.' },
  { icon: TrendingUp, title: 'Progressez', text: 'Suivez vos séries, vos niveaux et vos statistiques pour garder l\'élan.' },
]

const linkBase = 'group inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold transition duration-150 active:scale-[0.97]'

function StartLink({ to, variant = 'primary', className, children }) {
  return (
    <Link
      to={to}
      className={cn(
        linkBase,
        variant === 'primary'
          ? 'btn-brand'
          : 'border border-white/20 bg-white/10 text-white backdrop-blur-md hover:bg-white/20',
        className,
      )}
    >
      {children}
    </Link>
  )
}

export default function Home() {
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width: 767px)').matches)

  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)')
    const onChange = () => setCompact(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const showVideo = !compact && !reduceMotion

  return (
    <main className="min-h-dvh bg-bg">
      <section className="relative isolate flex min-h-dvh flex-col overflow-hidden bg-[#050808] text-white">
        {showVideo ? (
          <video
            className="absolute inset-0 -z-20 size-full object-cover"
            src="/media/hero-pexels.mp4"
            poster="/media/hero-pexels-poster.jpg"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
            tabIndex={-1}
            style={{ transform: 'scaleX(-1)' }}
          />
        ) : (
          <img
            className="absolute inset-0 -z-20 size-full object-cover"
            src="/media/hero-pexels-poster.jpg"
            alt=""
            aria-hidden="true"
            style={{ transform: 'scaleX(-1)' }}
          />
        )}
        <div
          className="absolute inset-0 -z-10"
          style={{
            background: [
              'linear-gradient(180deg, rgb(var(--veil-rgb) / 0.78) 0%, transparent 28%, transparent 58%, rgb(var(--veil-rgb)) 100%)',
              'linear-gradient(90deg, rgb(var(--veil-rgb) / 0.94) 0%, rgb(var(--veil-rgb) / 0.66) 48%, rgb(var(--veil-rgb) / 0.4) 100%)',
            ].join(', '),
          }}
          aria-hidden="true"
        />

        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 sm:px-8">
          <header className="flex items-center justify-between py-5 sm:py-6">
            <Link to="/" aria-label="Accueil FocusFlow" className="rounded-xl">
              <Logo inverted />
            </Link>
            <nav className="flex items-center gap-1.5 sm:gap-2">
              <Link
                to="/login"
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white sm:px-4"
              >
                Se connecter
              </Link>
              <Link
                to="/signup"
                className="inline-flex h-10 items-center rounded-xl bg-white px-4 text-sm font-semibold text-brand-950 transition hover:bg-white/90 active:scale-[0.97]"
              >
                Créer un compte
              </Link>
            </nav>
          </header>

          <div className="flex flex-1 items-center py-14 sm:py-20">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white/85 backdrop-blur-md">
                <Sparkles className="size-3.5 text-brand-300" aria-hidden />
                Discipline personnelle, simplement
              </p>
              <h1 className="mt-6 font-display text-[2.75rem] leading-[1.02] font-semibold tracking-tight sm:text-6xl lg:text-7xl">
                Moins de bruit.
                <br />
                <span className="text-brand-300">Plus de progrès.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
                FocusFlow transforme vos objectifs en actions quotidiennes, protège votre concentration et rend vos progrès visibles.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <StartLink to="/signup">
                  Commencer gratuitement
                  <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
                </StartLink>
                <StartLink to="/login" variant="secondary">J'ai déjà un compte</StartLink>
              </div>
              <p className="mt-5 text-sm text-white/55">Gratuit · Sans carte bancaire · Prêt en quelques minutes</p>
            </div>
          </div>

          <ul className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md sm:grid-cols-3">
            {HERO_FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-start gap-3 bg-[#050808]/60 p-4 sm:p-5">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/10 text-brand-300">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="mt-0.5 text-xs text-white/55">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="relative py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.18em] text-brand-600 uppercase dark:text-brand-300">La méthode FocusFlow</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
              Assez simple pour être tenue. Assez solide pour durer.
            </h2>
            <p className="mt-4 text-muted">
              Pas de tableaux complexes ni de promesses magiques. Un rythme clair, des priorités visibles, et la satisfaction de cocher ce qui compte.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {PILLARS.map(({ icon: Icon, title, text }, index) => (
              <div
                key={title}
                className="group rounded-2xl border border-line bg-surface p-6 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-brand-400/40 hover:shadow-pop dark:bg-surface/70"
              >
                <div className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="font-display text-sm font-semibold text-subtle">0{index + 1}</span>
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold text-fg">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
              </div>
            ))}
          </div>

          <div className="hero-surface relative mt-16 overflow-hidden rounded-3xl px-6 py-12 text-center text-white sm:px-12 sm:py-16">
            <div className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
            <h2 className="relative font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Le meilleur moment pour commencer, c'est aujourd'hui.
            </h2>
            <p className="relative mx-auto mt-3 max-w-xl text-sm text-white/70 sm:text-base">
              Quelques minutes suffisent pour poser votre première intention et retrouver un rythme qui vous ressemble.
            </p>
            <StartLink to="/signup" className="relative mt-8">
              Créer mon compte
              <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
            </StartLink>
          </div>
        </div>
      </section>

      <footer className="border-t border-line py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 px-5 sm:flex-row sm:px-8">
          <Logo />
          <p className="text-center text-sm text-muted">© {new Date().getFullYear()} FocusFlow. Discipline personnelle, simplement.</p>
          <nav className="flex gap-5 text-sm font-medium text-muted">
            <Link to="/login" className="transition hover:text-fg">Se connecter</Link>
            <Link to="/signup" className="transition hover:text-fg">Créer un compte</Link>
          </nav>
        </div>
      </footer>
    </main>
  )
}
