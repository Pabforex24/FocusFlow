import { Component } from 'react'
import { RefreshCw, TriangleAlert } from 'lucide-react'

// Évite l'écran blanc : une erreur de rendu affiche un message et un bouton de rechargement.
export default class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error, info) { console.error('[ui] erreur de rendu', error, info) }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="grid min-h-dvh place-items-center bg-bg p-6">
        <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 text-center shadow-card">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-rose-500/10 text-rose-600"><TriangleAlert className="size-7" aria-hidden /></span>
          <h1 className="mt-4 text-lg font-semibold text-fg">Oups, quelque chose s'est mal passé</h1>
          <p className="mt-1 text-sm text-muted">{String(this.state.error.message || this.state.error)}</p>
          <button type="button" onClick={() => window.location.reload()}
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl btn-brand px-4 text-sm font-semibold">
            <RefreshCw className="size-4" aria-hidden />Recharger l'application
          </button>
        </div>
      </div>
    )
  }
}
