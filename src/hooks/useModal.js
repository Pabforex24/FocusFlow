import { useState, useCallback } from 'react'


/**
 * Generic hook to manage modal open/close state with optional data payload.
 *
 * Usage:
 *   const modal = useModal()
 *   modal.open(domain)   → opens with data
 *   modal.open()         → opens without data
 *   modal.close()        → closes
 *   modal.isOpen         → boolean
 *   modal.data           → T | null
 */
export function useModal() {
  const [state, setState] = useState>({ open: false, data: null })

  const openModal = useCallback((data) => {
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
