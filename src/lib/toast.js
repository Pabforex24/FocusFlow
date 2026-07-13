/**
 * toast.ts — Bus d'événements global pour afficher des toasts depuis
 * n'importe où (store, hooks) sans dépendre de React Context.
 * Le ToastProvider enregistre son handler via registerToastHandler().
 */


let _handler = null

export function registerToastHandler(fn: ToastHandler) {
  _handler = fn
}

export function showToast(message, type: ToastType = 'info') {
  _handler?.(message, type)
}
