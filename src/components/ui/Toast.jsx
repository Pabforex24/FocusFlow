'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { CheckCircle, Info, AlertTriangle, X, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { registerToastHandler } from '@/lib/toast'


const ToastContext = createContext({ toast: () => {} })

export function ToastProvider({ children }: { children: any }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, type: ToastType = 'info') => {
    const id = Date.now().toString()
    setToasts((prev) => [...prev, { id, message, type }])
    const delay = type === 'error' ? 5000 : 3000
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), delay)
  }, [])

  // Enregistre le handler global pour que showToast() fonctionne hors de React
  useEffect(() => {
    registerToastHandler(toast)
  }, [toast])

  const remove = (id) => setToasts((prev) => prev.filter((t) => t.id !== id))

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-card text-sm font-medium',
              'pointer-events-auto animate-fade-up',
              t.type === 'success' && 'bg-bg-3 border-success/30 text-success',
              t.type === 'info'    && 'bg-bg-3 border-accent/30 text-accent',
              t.type === 'warning' && 'bg-bg-3 border-warning/30 text-warning',
              t.type === 'error'   && 'bg-bg-3 border-red-500/30 text-red-400',
            )}
          >
            {t.type === 'success' && <CheckCircle  size={15} />}
            {t.type === 'info'    && <Info         size={15} />}
            {t.type === 'warning' && <AlertTriangle size={15} />}
            {t.type === 'error'   && <XCircle      size={15} />}
            {t.message}
            <button onClick={() => remove(t.id)} className="ml-1 opacity-60 hover:opacity-100">
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
