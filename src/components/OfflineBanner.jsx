import { RefreshCw, WifiOff } from 'lucide-react'
import { Alert } from './ui/Alert.jsx'
import { Button } from './ui/Button.jsx'
import { useData } from '../contexts/DataContext.jsx'

const formatSync = (ms) => new Date(ms).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

// Bandeau affiché quand les données à l'écran sont une copie : pas de réseau, ou serveur injoignable.
export default function OfflineBanner() {
  const { online, stale, lastSync, actions } = useData()
  if (online && !stale) return null
  const since = lastSync ? ` Données enregistrées le ${formatSync(lastSync)}.` : ''
  return (
    <Alert tone="warning" icon={WifiOff} className="mb-4"
      title={online ? 'Serveur injoignable' : 'Vous êtes hors-ligne'}
      action={online ? <Button size="sm" variant="secondary" icon={RefreshCw} onClick={() => actions.refresh({ silent: true })}>Réessayer</Button> : null}>
      {online ? 'Vous consultez une copie enregistrée sur cet appareil.' : 'Consultation seule : les modifications reviendront avec le réseau.'}{since}
    </Alert>
  )
}
