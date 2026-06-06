/**
 * toast.ts — Bus d'événements global pour afficher des toasts depuis
 * n'importe où (store, hooks) sans dépendre de React Context.
 * Le ToastProvider enregistre son handler via registerToastHandler().
 */

export type ToastType = 'success' | 'info' | 'warning' | 'error'

type ToastHandler = (message: string, type: ToastType) => void

let _handler: ToastHandler | null = null

export function registerToastHandler(fn: ToastHandler) {
  _handler = fn
}

export function showToast(message: string, type: ToastType = 'info') {
  _handler?.(message, type)
}
