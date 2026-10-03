import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

// Ouvre une modale de création quand l'URL contient ?new=1 (bouton "+" mobile), puis nettoie l'URL.
export function useOpenOnNew(open) {
  const [params, setParams] = useSearchParams()
  useEffect(() => {
    if (params.get('new') === '1') {
      open()
      setParams({}, { replace: true })
    }
  }, [params, setParams, open])
}
