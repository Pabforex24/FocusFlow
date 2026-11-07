import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('web-push', () => ({
  default: { setVapidDetails: vi.fn(), sendNotification: vi.fn() },
}))

const BASE_ENV = {
  CRON_SECRET: 'cron_test_secret',
  SUPABASE_URL: 'https://db.test',
  SUPABASE_ANON_KEY: 'anon_test_secret',
  SUPABASE_SERVICE_ROLE_KEY: 'service_test_secret',
  VAPID_PRIVATE_KEY: 'vapid_private_secret',
  VAPID_SUBJECT: 'mailto:test@example.com',
  VITE_VAPID_PUBLIC_KEY: 'vapid_public',
}

async function loadNotify(overrides = {}) {
  vi.resetModules()
  const env = { ...BASE_ENV, ...overrides }
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value)
  return import('./notify.js')
}

const post = (headers = {}) =>
  new Request('https://app.test/api/notify', { method: 'POST', headers })

const get = (headers = {}) =>
  new Request('https://app.test/api/notify', { headers })

const auth = { authorization: 'Bearer cron_test_secret' }

describe('api/notify — sécurité', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('renvoie 503 quand le serveur n’est pas configuré', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { POST } = await loadNotify({ CRON_SECRET: '' })
    expect((await POST(post())).status).toBe(503)
  })

  it('refuse un POST sans secret ou avec un mauvais secret', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const { POST } = await loadNotify()

    expect((await POST(post())).status).toBe(401)
    expect((await POST(post({ authorization: 'Bearer mauvais' }))).status).toBe(401)
    expect((await POST(post({ authorization: 'Bearer cron_test_secret_plus_long' }))).status).toBe(401)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('traite un POST authentifié sans utilisateur à notifier', async () => {
    vi.stubGlobal('fetch', vi.fn((url) => {
      const href = String(url)
      if (href.includes('/rest/v1/profiles')) return Promise.resolve(Response.json([]))
      throw new Error(`appel inattendu : ${href}`)
    }))
    const { POST } = await loadNotify()

    const res = await POST(post(auth))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ candidates: 0, due: 0, notified: 0, sent: 0 })
  })

  it('protège le diagnostic GET par CRON_SECRET', async () => {
    const { GET } = await loadNotify()

    expect((await GET(get())).status).toBe(401)
    expect((await GET(get({ authorization: 'Bearer mauvais' }))).status).toBe(401)

    const res = await GET(get(auth))
    expect(res.status).toBe(200)
    const body = await res.text()
    expect(body).toContain('"CRON_SECRET":true')
    expect(body).not.toContain('cron_test_secret')
    expect(body).not.toContain('service_test_secret')
    expect(body).not.toContain('vapid_private_secret')
  })

  it('refuse le diagnostic quand CRON_SECRET est absent', async () => {
    const { GET } = await loadNotify({ CRON_SECRET: '' })
    expect((await GET(get())).status).toBe(401)
  })
})
