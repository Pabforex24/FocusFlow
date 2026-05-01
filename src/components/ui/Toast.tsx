'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, Info, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'info' | 'warning'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now().toString()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000)
  }, [])

  const remove = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id))

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-card text-sm font-medium',
              'pointer-events-auto animate-fade-up',
              t.type === 'success' && 'bg-bg-3 border-success/30 text-success',
              t.type === 'info' && 'bg-bg-3 border-accent/30 text-accent',
              t.type === 'warning' && 'bg-bg-3 border-warning/30 text-warning'
            )}
          >
            {t.type === 'success' && <CheckCircle size={15} />}
            {t.type === 'info' && <Info size={15} />}
            {t.type === 'warning' && <AlertTriangle size={15} />}
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
