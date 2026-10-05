// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { describe, it, expect } from 'vitest'
import { clearSnapshot, loadSnapshot, loadSnapshotOwner, saveSnapshot } from './snapshot.js'

describe('copie locale (snapshot)', () => {
  it('enregistre puis relit les données de l\'utilisateur', async () => {
    await saveSnapshot('u1', { tasks: [{ id: 't1' }] })
    const saved = await loadSnapshot('u1')
    expect(saved.data).toEqual({ tasks: [{ id: 't1' }] })
    expect(saved.savedAt).toBeGreaterThan(0)
  })

  it('ne rend jamais la copie d\'un autre utilisateur', async () => {
    await saveSnapshot('u1', { tasks: [] })
    expect(await loadSnapshot('u2')).toBeNull()
  })

  it('efface la copie à la déconnexion', async () => {
    await saveSnapshot('u1', { tasks: [] })
    await clearSnapshot()
    expect(await loadSnapshot('u1')).toBeNull()
  })

  it('retrouve le compte propriétaire de la copie, sans ses données sensibles', async () => {
    await saveSnapshot('u1', { tasks: [] }, { id: 'u1', email: 'a@b.fr', user_metadata: { display_name: 'A' }, app_metadata: { secret: 1 }, aud: 'x' })
    expect(await loadSnapshotOwner()).toEqual({ id: 'u1', email: 'a@b.fr', user_metadata: { display_name: 'A' } })
  })
})
