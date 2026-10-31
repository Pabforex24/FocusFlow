import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, Lock } from 'lucide-react'
import Logo from '../components/layout/Logo.jsx'
import { Alert } from '../components/ui/Alert.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Field, Input } from '../components/ui/Input.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { toUserMessage } from '../lib/errors.js'
import { MIN_PASSWORD } from '../lib/password.js'

// Affichée quand l'utilisateur ouvre le lien reçu par e-mail : il choisit un nouveau mot de passe.
export default function ResetPassword() {
  const { updatePassword, cancelRecovery } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < MIN_PASSWORD) return setError(`Le mot de passe doit contenir au moins ${MIN_PASSWORD} caractères.`)
    if (password !== confirm) return setError('Les deux mots de passe ne sont pas identiques.')
    setBusy(true)
    try {
      await updatePassword(password) // met fin au mode « récupération » : l'application s'ouvre ensuite
    } catch (err) {
      setError(toUserMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden p-5 pt-safe pb-safe sm:p-8">
      <div className="pointer-events-none absolute -top-32 -right-24 size-96 rounded-full bg-brand-500/10 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 size-96 rounded-full bg-brand-500/10 blur-3xl" aria-hidden="true" />

      <div className="relative w-full max-w-md animate-fade-up">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" onClick={cancelRecovery} aria-label="Retour à l'accueil" className="rounded-xl">
            <Logo />
          </Link>
          <Link
            to="/"
            onClick={cancelRecovery}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-2 text-sm font-medium text-muted shadow-xs transition hover:border-brand-400/40 hover:bg-surface-2 hover:text-fg"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Accueil
          </Link>
        </div>

        <form onSubmit={submit} noValidate className="w-full space-y-5 rounded-2xl border border-line bg-surface/95 p-6 shadow-card backdrop-blur-sm sm:p-8">
          <div>
            <span className="grid size-11 place-items-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
              <Lock className="size-5" aria-hidden />
            </span>
            <h1 className="mt-5 text-2xl font-bold tracking-tight text-fg">Nouveau mot de passe</h1>
            <p className="mt-1 text-sm text-muted">Choisissez un mot de passe d'au moins {MIN_PASSWORD} caractères.</p>
          </div>

          <Field label="Nouveau mot de passe">
            <div className="relative">
              <Lock className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle" aria-hidden />
              <Input
                className="pr-12 pl-10"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                className="absolute top-1/2 right-1.5 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-subtle transition hover:bg-surface-2 hover:text-fg"
              >
                {showPassword ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
              </button>
            </div>
          </Field>

          <Field label="Confirmer le mot de passe">
            <div className="relative">
              <Lock className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle" aria-hidden />
              <Input
                className="pr-12 pl-10"
                type={showConfirm ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((value) => !value)}
                aria-label={showConfirm ? 'Masquer la confirmation' : 'Afficher la confirmation'}
                className="absolute top-1/2 right-1.5 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-subtle transition hover:bg-surface-2 hover:text-fg"
              >
                {showConfirm ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
              </button>
            </div>
          </Field>

          {error && <Alert tone="danger">{error}</Alert>}
          <Button type="submit" size="lg" className="w-full" loading={busy}>Enregistrer et continuer</Button>
          <p className="text-center text-xs text-muted">Vous pourrez ensuite vous connecter avec ce nouveau mot de passe.</p>
        </form>
      </div>
    </main>
  )
}
