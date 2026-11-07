import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('web-push', () => ({
  default: { setVapidDetails: vi.fn(), sendNotification: vi.fn() },
}))

const BASE_ENV = {
  SUPABASE_URL: 'https://db.test',
  SUPABASE_ANON_KEY: 'anon_test_secret',
  SUPABASE_SERVICE_ROLE_KEY: 'service_test_secret',
  VITE_VAPID_PUBLIC_KEY: 'vapid_public',
  VAPID_PRIVATE_KEY: 'vapid_private_secret',
  VAPID_SUBJECT: 'mailto:test@example.com',
}

async function loadPushTest(overrides = {}) {
  vi.resetModules()
  const env = { ...BASE_ENV, ...overrides }
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value)
  return import('./push-test.js')
}

const post = (headers = {}) =>
  new Request('https://app.test/api/push-test', { method: 'POST', headers })

const auth = { authorization: 'Bearer jeton-valide' }

describe('api/push-test — sécurité', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('renvoie 503 quand le serveur n’est pas configuré', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { POST } = await loadPushTest({ VAPID_PRIVATE_KEY: '' })
    expect((await POST(post(auth))).status).toBe(503)
  })

  it('refuse une requête sans jeton', async () => {
    const { POST } = await loadPushTest()
    expect((await POST(post())).status).toBe(401)
  })

  it('refuse un jeton Supabase invalide sans interroger la base', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response('{}', { status: 401 })))
    vi.stubGlobal('fetch', fetchMock)
    const { POST } = await loadPushTest()

    expect((await POST(post(auth))).status).toBe(401)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(String(fetchMock.mock.calls[0][0])).toContain('/auth/v1/user')
  })

  it('ne lit que les abonnements de l’utilisateur authentifié', async () => {
    const calls = []
    vi.stubGlobal('fetch', vi.fn((url) => {
      const href = String(url)
      calls.push(href)
      if (href.includes('/auth/v1/user')) return Promise.resolve(Response.json({ id: 'user-1' }))
      if (href.includes('/rest/v1/push_subscriptions')) return Promise.resolve(Response.json([]))
      throw new Error(`appel inattendu : ${href}`)
    }))
    const { POST } = await loadPushTest()

    const res = await POST(post(auth))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: false, reason: 'no-subscription', sent: 0 })

    const query = calls.find((href) => href.includes('/rest/v1/push_subscriptions'))
    expect(query).toContain('user_id=eq.user-1')
  })

  it('n’expose plus de diagnostic GET public', async () => {
    const mod = await loadPushTest()
    expect(mod.GET).toBeUndefined()
  })
})
