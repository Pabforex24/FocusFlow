import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Bell, Check, Flame, ListChecks, TrendingUp } from 'lucide-react'
import { useNavAlerts } from '../../hooks/useNavAlerts.js'
import { useAnchoredPanel } from '../../lib/useAnchoredPanel.js'
import { cn } from '../../lib/cn.js'

const kinds = {
  tasks: { icon: ListChecks, tone: 'bg-brand-500/10 text-brand-600 dark:text-brand-300' },
  streak: { icon: Flame, tone: 'bg-amber-500/12 text-amber-600 dark:text-amber-400' },
  level: { icon: TrendingUp, tone: 'bg-sky-500/10 text-sky-600 dark:text-sky-400' },
}

export default function NotificationsMenu({ buttonClassName }) {
  const navigate = useNavigate()
  const { alerts, unread, markRead } = useNavAlerts()
  const { triggerRef, panelRef, open, setOpen, pos, close } = useAnchoredPanel({ width: 352 })

  useEffect(() => {
    if (!open || !pos || panelRef.current?.contains(document.activeElement)) return
    panelRef.current?.focus({ preventScroll: true })
  }, [open, pos, panelRef])

  const toggle = () => {
    if (open) { close(); return }
    markRead()
    setOpen(true)
  }

  const go = (to) => { close(); navigate(to) }

  return (
    <>
      <button ref={triggerRef} type="button" onClick={toggle} aria-label={unread ? `Notifications, ${unread} non lue${unread > 1 ? 's' : ''}` : 'Notifications'}
        aria-expanded={open} aria-haspopup="dialog"
        className={cn('relative grid size-11 shrink-0 place-items-center rounded-2xl border border-line bg-surface-2/70 text-muted transition hover:text-fg active:scale-95', buttonClassName)}>
        <Bell className="size-5" aria-hidden />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 grid min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] leading-5 font-bold text-white ring-2 ring-surface tabular-nums">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && createPortal(
        <div ref={panelRef} role="dialog" aria-label="Alertes du jour" tabIndex={-1}
          className={cn('fixed z-50 max-h-[min(70dvh,28rem)] overflow-y-auto rounded-3xl border border-line bg-surface p-2 shadow-pop animate-scale-in outline-none', pos?.up ? 'origin-bottom-right' : 'origin-top-right')}
          style={{ left: pos?.left ?? 0, top: pos?.top ?? 0, width: pos?.width ?? 352, visibility: pos ? 'visible' : 'hidden' }}>
          <div className="flex items-center gap-3 px-3 pt-2 pb-3">
            <span className="grid size-9 place-items-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-300"><Bell className="size-4" aria-hidden /></span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-fg">Alertes du jour</p>
              <p className="text-xs text-muted">{unread > 0 ? `${unread} non lue${unread > 1 ? 's' : ''}` : 'À jour'}</p>
            </div>
          </div>
          <div className="border-t border-line pt-1">
            {alerts.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <span className="mx-auto grid size-10 place-items-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><Check className="size-5" aria-hidden /></span>
                <p className="mt-3 text-sm font-semibold text-fg">Tout est à jour</p>
                <p className="mt-1 text-xs text-muted">Aucune alerte pour le moment.</p>
              </div>
            ) : alerts.map((alert) => {
              const kind = kinds[alert.kind] ?? kinds.tasks
              const Icon = kind.icon
              return (
                <button key={alert.id} type="button" onClick={() => go(alert.to)}
                  className="flex min-h-14 w-full items-start gap-3 rounded-2xl p-3 text-left transition hover:bg-surface-2 active:scale-[0.99]">
                  <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl', kind.tone)}><Icon className="size-5" aria-hidden /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-fg">{alert.title}</span>
                    <span className="block text-xs text-muted">{alert.description}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
