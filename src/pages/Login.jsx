import { useState } from 'react'
import { Eye, EyeOff, Lock, Mail, Target, Timer, TrendingUp, User } from 'lucide-react'
import Logo from '../components/layout/Logo.jsx'
import { Alert } from '../components/ui/Alert.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Field, Input } from '../components/ui/Input.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { toUserMessage } from '../lib/errors.js'
import { MIN_PASSWORD } from '../lib/password.js'

const PERKS = [
  { icon: Target, text: 'Transformez vos objectifs en tâches quotidiennes' },
  { icon: Timer, text: 'Restez concentré avec le mode Focus' },
  { icon: TrendingUp, text: 'Suivez votre série, vos niveaux et vos progrès' },
]

function IconInput({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle" aria-hidden />
      <Input className="pl-10" {...props} />
    </div>
  )
}

export default function Login() {
  const { signIn, signUp, resetPassword } = useAuth()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ email: '', password: '', name: '' })
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const login = mode === 'login'
  const forgot = mode === 'forgot'
  const switchMode = (next) => { setMode(next); setError(''); setNotice('') }

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setNotice('')
    const email = form.email.trim()
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Entrez une adresse email valide.')
    if (!forgot && !login && form.password.length < MIN_PASSWORD) return setError(`Le mot de passe doit contenir au moins ${MIN_PASSWORD} caractères.`)
    if (!forgot && login && !form.password) return setError('Entrez votre mot de passe.')
    setBusy(true)
    try {
      if (forgot) {
        await resetPassword(email)
        setNotice('Si un compte existe pour cette adresse, un e-mail avec un lien de réinitialisation vient d\'être envoyé.')
      } else if (login) await signIn(email, form.password)
      else {
        const { needsConfirmation } = await signUp(email, form.password, form.name.trim())
        if (needsConfirmation) setNotice('Compte créé. Confirmez votre email puis connectez-vous.')
      }
    } catch (err) {
      setError(toUserMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden hero-surface p-12 text-white lg:flex">
        <div className="pointer-events-none absolute -right-24 -bottom-24 size-96 rounded-full bg-white/10 blur-3xl" aria-hidden />
        <div className="relative flex items-center gap-2.5 text-lg font-bold">FocusFlow</div>
        <div className="relative max-w-md space-y-6">
          <h2 className="text-4xl leading-tight font-bold tracking-tight">Agissez chaque jour, avancez vers vos objectifs.</h2>
          <ul className="space-y-4">
            {PERKS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-white/85"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/15"><Icon className="size-5" aria-hidden /></span>{text}</li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-white/60">Discipline personnelle, simplement.</p>
      </aside>

      <main className="flex items-center justify-center p-5 pt-safe pb-safe sm:p-8">
        <form onSubmit={submit} noValidate className="w-full max-w-sm animate-fade-up space-y-5">
          <Logo className="lg:hidden" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-fg">{forgot ? 'Mot de passe oublié' : login ? 'Bon retour !' : 'Créer votre compte'}</h1>
            <p className="mt-1 text-sm text-muted">{forgot ? 'Entrez votre e-mail : nous vous envoyons un lien pour en choisir un nouveau.' : login ? 'Connectez-vous pour retrouver vos tâches.' : 'Quelques secondes pour commencer.'}</p>
          </div>

          {mode === 'signup' && <Field label="Prénom"><IconInput icon={User} value={form.name} onChange={set('name')} maxLength={40} autoComplete="given-name" placeholder="Votre prénom" /></Field>}
          <Field label="Email"><IconInput icon={Mail} type="email" value={form.email} onChange={set('email')} autoComplete="email" placeholder="vous@exemple.com" /></Field>
          {!forgot && <Field label="Mot de passe">
            <div className="relative">
              <Lock className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle" aria-hidden />
              <Input className="pr-12 pl-10" type={show ? 'text' : 'password'} value={form.password} onChange={set('password')} autoComplete={login ? 'current-password' : 'new-password'} placeholder={login ? 'Votre mot de passe' : `${MIN_PASSWORD} caractères minimum`} />
              <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                className="absolute top-1/2 right-1.5 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-subtle hover:bg-surface-2 hover:text-fg">
                {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
              </button>
            </div>
          </Field>}
          {login && <p className="-mt-2 text-right"><button type="button" onClick={() => switchMode('forgot')} className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-300">Mot de passe oublié ?</button></p>}

          {error && <Alert tone="danger">{error}</Alert>}
          {notice && <Alert tone="success">{notice}</Alert>}

          <Button type="submit" size="lg" className="w-full" loading={busy}>{forgot ? 'Envoyer le lien' : login ? 'Se connecter' : 'Créer mon compte'}</Button>
          <p className="text-center text-sm text-muted">
            {forgot ? (
              <button type="button" onClick={() => switchMode('login')} className="font-semibold text-brand-600 hover:underline dark:text-brand-300">Retour à la connexion</button>
            ) : (
              <>
                {login ? 'Pas encore de compte ? ' : 'Déjà un compte ? '}
                <button type="button" onClick={() => switchMode(login ? 'signup' : 'login')} className="font-semibold text-brand-600 hover:underline dark:text-brand-300">{login ? "S'inscrire" : 'Se connecter'}</button>
              </>
            )}
          </p>
        </form>
      </main>
    </div>
  )
}
