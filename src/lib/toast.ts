export type ToastType = 'success' | 'info' | 'warning' | 'error'
type ToastHandler = (message: string, type: ToastType) => void
let _handler: ToastHandler | null = null
export function registerToastHandler(fn: ToastHandler) { _handler = fn }
export function showToast(message: string, type: ToastType = 'info') { _handler?.(message, type) }
