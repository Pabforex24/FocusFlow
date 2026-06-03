import { useState, useCallback } from 'react'

interface ModalState<T = undefined> {
  open: boolean
  data: T | null
}

/**
 * Generic hook to manage modal open/close state with optional data payload.
 *
 * Usage:
 *   const modal = useModal<Domain>()
 *   modal.open(domain)   → opens with data
 *   modal.open()         → opens without data
 *   modal.close()        → closes
 *   modal.isOpen         → boolean
 *   modal.data           → T | null
 */
export function useModal<T = undefined>() {
  const [state, setState] = useState<ModalState<T>>({ open: false, data: null })

  const openModal = useCallback((data?: T) => {
    setState({ open: true, data: data ?? null })
  }, [])

  const closeModal = useCallback(() => {
    setState({ open: false, data: null })
  }, [])

  return {
    isOpen: state.open,
    data: state.data,
    open: openModal,
    close: closeModal,
  }
}
