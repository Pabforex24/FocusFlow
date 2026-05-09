import { createClient, SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL  || ''
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const isValidUrl = (s: string) => {
  try { const u = new URL(s); return u.protocol === 'http:' || u.protocol === 'https:' }
  catch { return false }
}

export const isSupabaseConfigured = isValidUrl(url) && key.length > 10

export const supabase: SupabaseClient | null =
  isSupabaseConfigured ? createClient(url, key) : null

export function toCamel<T extends Record<string, any>>(row: T): any {
  return Object.fromEntries(
    Object.entries(row).map(([k, v]) => [
      k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()), v,
    ])
  )
}

export function toSnake<T extends Record<string, any>>(obj: T): any {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k.replace(/([A-Z])/g, (c) => `_${c.toLowerCase()}`), v,
    ])
  )
}
