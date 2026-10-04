import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

const TONES = {
  success: { icon: CircleCheck, cls: 'text-emerald-500' },
  error: { icon: CircleAlert, cls: 'text-rose-500' },
  info: { icon: Info, cls: 'text-sky-500' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), [])
  const push = useCallback((message, kind = 'info') => {
    const id = Date.now() + Math.random()
    setToasts((list) => [...list.slice(-3), { id, message, kind }])
    setTimeout(() => dismiss(id), kind === 'error' ? 6000 : 3500)
  }, [dismiss])

  const api = useMemo(() => ({
    success: (m) => push(m, 'success'),
    error: (m) => push(m, 'error'),
    info: (m) => push(m, 'info'),
  }), [push])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] md:items-end md:pr-6" aria-live="polite">
        {toasts.map((t) => {
          const { icon: Icon, cls } = TONES[t.kind]
          return (
            <div key={t.id} role={t.kind === 'error' ? 'alert' : 'status'} className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-line bg-surface p-3.5 text-sm shadow-pop animate-toast-in">
              <Icon className={`mt-0.5 size-5 shrink-0 ${cls}`} aria-hidden />
              <p className="flex-1 text-fg">{t.message}</p>
              <button type="button" onClick={() => dismiss(t.id)} aria-label="Fermer la notification" className="-m-1 rounded-lg p-1 text-subtle hover:bg-surface-2 hover:text-fg">
                <X className="size-4" aria-hidden />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
