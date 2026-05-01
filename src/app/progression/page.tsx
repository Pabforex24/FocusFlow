'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ProgressionRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/goals')
  }, [router])
  return null
}
