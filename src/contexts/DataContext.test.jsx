// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { DataProvider, useData } from './DataContext.jsx'
import * as api from '../services/api.js'
import { loadSnapshot, saveSnapshot } from '../lib/snapshot.js'

vi.mock('../services/api.js')
vi.mock('./AuthContext.jsx', () => ({ useAuth: () => ({ user: { id: 'u1' } }) }))
const toast = { success: vi.fn(), error: vi.fn(), info: vi.fn() }
vi.mock('./ToastContext.jsx', () => ({ useToast: () => toast }))
vi.mock('../lib/report.js', () => ({ reportError: vi.fn() }))
vi.mock('../lib/snapshot.js', () => ({ loadSnapshot: vi.fn(), saveSnapshot: vi.fn(), clearSnapshot: vi.fn() }))

const task = (id, extra = {}) => ({ id, title: id, scheduled_on: '2026-10-01', done: false, done_at: null, xp_value: 10, domain_id: null, goal_id: null, challenge_active_id: null, ...extra })
const snapshot = () => ({
  profile: { id: 'u1', hardcore_mode: false },
  domains: [{ id: 'd1', name: 'Sport' }, { id: 'd2', name: 'Travail' }],
  goals: [{ id: 'g1', domain_id: 'd1' }, { id: 'g2', domain_id: 'd2' }],
  tasks: [task('t1', { domain_id: 'd1', goal_id: 'g1' }), task('t2', { domain_id: 'd2', goal_id: 'g2' }), task('t3')],
  activeChallenges: [], customChallenges: [], restDays: [], focusSessions: [],
})

async function setup() {
  const view = renderHook(() => useData(), { wrapper: DataProvider })
  await waitFor(() => expect(view.result.current.status).toBe('ready'))
  return view
}

beforeEach(() => {
  vi.resetAllMocks()
  api.loadAll.mockResolvedValue(snapshot())
  loadSnapshot.mockResolvedValue(null)
  saveSnapshot.mockResolvedValue(undefined)
})

describe('DataContext', () => {
  it('charge les données au démarrage', async () => {
    const { result } = await setup()
    expect(api.loadAll).toHaveBeenCalledWith('u1')
    expect(result.current.tasks).toHaveLength(3)
  })

  it('signale une erreur de chargement au lieu de rester bloqué', async () => {
    api.loadAll.mockRejectedValue(new Error('Failed to fetch'))
    const view = renderHook(() => useData(), { wrapper: DataProvider })
    await waitFor(() => expect(view.result.current.status).toBe('error'))
    expect(view.result.current.loadError).toMatch(/serveur|connexion/i)
  })

  it('cocher une tâche : affichage immédiat puis ligne du serveur', async () => {
    const { result } = await setup()
    let resolve
    api.updateTask.mockReturnValue(new Promise((r) => { resolve = r }))
    let pending
    act(() => { pending = result.current.actions.toggleTask(result.current.tasks[0]) })
    expect(result.current.tasks[0].done).toBe(true) // déjà cochée avant la réponse du serveur
    await act(async () => { resolve({ ...task('t1', { domain_id: 'd1', goal_id: 'g1' }), done: true, done_at: 'serveur' }); await pending })
    expect(result.current.tasks[0].done_at).toBe('serveur')
  })

  it('cocher une tâche : retour arrière et message si le serveur refuse', async () => {
    const { result } = await setup()
    api.updateTask.mockRejectedValue(new Error('Failed to fetch'))
    let ok
    await act(async () => { ok = await result.current.actions.toggleTask(result.current.tasks[0]) })
    expect(ok).toBe(false)
    expect(result.current.tasks[0].done).toBe(false)
    expect(toast.error).toHaveBeenCalledTimes(1)
  })

  it('supprimer un domaine retire ses objectifs et détache ses tâches', async () => {
    const { result } = await setup()
    api.deleteDomain.mockResolvedValue(null)
    await act(async () => { await result.current.actions.removeDomain('d1') })
    expect(result.current.domains.map((d) => d.id)).toEqual(['d2'])
    expect(result.current.goals.map((g) => g.id)).toEqual(['g2'])
    const t1 = result.current.tasks.find((t) => t.id === 't1')
    expect(t1).toMatchObject({ domain_id: null, goal_id: null })
    const t2 = result.current.tasks.find((t) => t.id === 't2')
    expect(t2).toMatchObject({ domain_id: 'd2', goal_id: 'g2' })
  })

  it('ne recharge pas les données pendant une modification en cours', async () => {
    const { result } = await setup()
    let resolve
    api.updateTask.mockReturnValue(new Promise((r) => { resolve = r }))
    let pending
    act(() => { pending = result.current.actions.editTask('t1', { title: 'Nouveau' }) })
    await act(async () => { await result.current.actions.refresh() })
    expect(api.loadAll).toHaveBeenCalledTimes(1) // seulement le chargement initial
    await act(async () => { resolve(task('t1', { title: 'Nouveau' })); await pending })
  })

  it("un seul imprévu par semaine : le second est refusé sans appeler le serveur", async () => {
    const { result } = await setup()
    api.addRestDay.mockResolvedValue({})
    await act(async () => { await result.current.actions.declareRestDay('2026-10-05') }) // lundi
    let ok
    await act(async () => { ok = await result.current.actions.declareRestDay('2026-10-07') }) // mercredi, même semaine
    expect(ok).toBe(false)
    expect(api.addRestDay).toHaveBeenCalledTimes(1)
    expect(toast.error).toHaveBeenCalledWith('Un seul imprévu par semaine est autorisé.')
  })

  it('enregistre une copie locale après un chargement réussi', async () => {
    await setup()
    await waitFor(() => expect(saveSnapshot).toHaveBeenCalledWith('u1', expect.objectContaining({ tasks: expect.any(Array) }), { id: 'u1' }))
  })

  it('affiche la copie locale tout de suite, puis les données du serveur', async () => {
    let resolveNetwork
    api.loadAll.mockReturnValue(new Promise((r) => { resolveNetwork = r }))
    loadSnapshot.mockResolvedValue({ savedAt: 1000, data: snapshot() })
    const view = renderHook(() => useData(), { wrapper: DataProvider })
    await waitFor(() => expect(view.result.current.status).toBe('ready'))
    expect(view.result.current.tasks).toHaveLength(3) // copie, avant la réponse du réseau
    expect(view.result.current.lastSync).toBe(1000)
    await act(async () => { resolveNetwork({ ...snapshot(), tasks: [task('t9')] }) })
    expect(view.result.current.tasks.map((t) => t.id)).toEqual(['t9'])
    expect(view.result.current.stale).toBe(false)
  })

  it('serveur injoignable : garde la copie locale au lieu d\'un écran d\'erreur', async () => {
    api.loadAll.mockRejectedValue(new Error('Failed to fetch'))
    loadSnapshot.mockResolvedValue({ savedAt: 1000, data: snapshot() })
    const view = renderHook(() => useData(), { wrapper: DataProvider })
    await waitFor(() => expect(view.result.current.stale).toBe(true))
    expect(view.result.current.status).toBe('ready')
    expect(view.result.current.tasks).toHaveLength(3)
  })

  it('hors-ligne : les modifications sont refusées tout de suite, sans appeler le serveur', async () => {
    const { result } = await setup()
    const onLine = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    let ok
    await act(async () => { ok = await result.current.actions.toggleTask(result.current.tasks[0]) })
    expect(ok).toBe(false)
    expect(api.updateTask).not.toHaveBeenCalled()
    expect(result.current.tasks[0].done).toBe(false)
    expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/hors-ligne/i))
    onLine.mockRestore()
  })

  it('enregistre une session Focus en une seule appel API et coche la tâche liée', async () => {
    const { result } = await setup()
    api.recordFocus.mockResolvedValue({
      session: { id: 'f1', user_id: 'u1', minutes: 25, task_id: 't1', completed_on: '2026-10-08' },
      task: { ...task('t1', { domain_id: 'd1', goal_id: 'g1' }), done: true, done_at: 'serveur' },
    })
    await act(async () => { await result.current.actions.recordFocus({ minutes: 25, taskId: 't1' }) })
    expect(api.recordFocus).toHaveBeenCalledTimes(1) // une transaction serveur, pas deux requêtes
    expect(api.recordFocus).toHaveBeenCalledWith({ minutes: 25, taskId: 't1', completedOn: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/) })
    expect(api.updateTask).not.toHaveBeenCalled()
    expect(result.current.focusSessions).toHaveLength(1)
    expect(result.current.tasks.find((t) => t.id === 't1')).toMatchObject({ done: true, done_at: 'serveur' })
    expect(toast.success).toHaveBeenCalledWith('Session Focus terminée : +30 XP')
  })

  it('session Focus refusée par le serveur : rien n\'est modifié localement', async () => {
    const { result } = await setup()
    api.recordFocus.mockRejectedValue(new Error('Failed to fetch'))
    let ok
    await act(async () => { ok = await result.current.actions.recordFocus({ minutes: 25, taskId: 't1' }) })
    expect(ok).toBe(false)
    expect(result.current.focusSessions).toHaveLength(0)
    expect(result.current.tasks.find((t) => t.id === 't1').done).toBe(false)
    expect(toast.error).toHaveBeenCalled()
  })
})
