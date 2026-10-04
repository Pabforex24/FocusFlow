import { useState } from 'react'
import { Lock } from 'lucide-react'
import Logo from '../components/layout/Logo.jsx'
import { Alert } from '../components/ui/Alert.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Field, Input } from '../components/ui/Input.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { toUserMessage } from '../lib/errors.js'
import { MIN_PASSWORD } from '../lib/password.js'

// Affichée quand l'utilisateur ouvre le lien reçu par e-mail : il choisit un nouveau mot de passe.
export default function ResetPassword() {
  const { updatePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
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
    <main className="grid min-h-dvh place-items-center p-5 pt-safe pb-safe sm:p-8">
      <form onSubmit={submit} noValidate className="w-full max-w-sm animate-fade-up space-y-5">
        <Logo />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg">Nouveau mot de passe</h1>
          <p className="mt-1 text-sm text-muted">Choisissez un mot de passe d'au moins {MIN_PASSWORD} caractères.</p>
        </div>
        <Field label="Nouveau mot de passe">
          <div className="relative">
            <Lock className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle" aria-hidden />
            <Input className="pl-10" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          </div>
        </Field>
        <Field label="Confirmer le mot de passe">
          <div className="relative">
            <Lock className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle" aria-hidden />
            <Input className="pl-10" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
          </div>
        </Field>
        {error && <Alert tone="danger">{error}</Alert>}
        <Button type="submit" size="lg" className="w-full" loading={busy}>Enregistrer et continuer</Button>
      </form>
    </main>
  )
}
