// Tests d'isolation RLS de FocusFlow.
//
// À lancer contre un projet Supabase DE TEST (jamais la production), avec deux comptes
// déjà créés et la confirmation d'email désactivée :
//
//   cp security/.env.test.example .env.test   # puis renseigner les valeurs
//   npm run test:rls
//
// Le script vérifie qu'un utilisateur B ne peut ni lire, ni modifier, ni supprimer les
// données de A, ni s'attribuer ses ressources, et que les défis partagés respectent
// leurs règles (aperçu sans code, classement réservé aux membres, adhésion à l'heure).
// Il ne supprime que les lignes qu'il a créées.

import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const url = process.env.TEST_SUPABASE_URL
const anonKey = process.env.TEST_SUPABASE_ANON_KEY
const serviceKey = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY

if (!url || !anonKey) {
  console.log('RLS ignoré : TEST_SUPABASE_URL / TEST_SUPABASE_ANON_KEY absents.')
  process.exit(0)
}

const required = ['TEST_EMAIL_A', 'TEST_PASSWORD_A', 'TEST_EMAIL_B', 'TEST_PASSWORD_B']
const missing = required.filter((key) => !process.env[key])
if (missing.length > 0) {
  console.error(`RLS : variables manquantes → ${missing.join(', ')}`)
  process.exit(2)
}

const makeClient = (key = anonKey) => createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
})

const a = makeClient()
const b = makeClient()
const anon = makeClient()

const DOMAIN_A = '#7B61FF'
const DOMAIN_B = '#34D399'
const day = (offset) => {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() + offset)
  return date.toISOString().slice(0, 10)
}
const today = day(0)

let passed = 0
const section = (title) => console.log(`\n${title}`)
const ok = (label) => {
  passed += 1
  console.log(`  ✓ ${label}`)
}

async function signIn(client, email, password, label) {
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  assert.equal(error, null, `${label} : connexion impossible (${error?.message})`)
  assert.ok(data?.user?.id, `${label} : utilisateur introuvable`)
  return data.user
}

async function rows(query, label) {
  const { data, error } = await query
  assert.equal(error, null, `${label} : ${error?.message}`)
  return data ?? []
}

async function expectEmpty(query, label) {
  const data = await rows(query, label)
  assert.deepEqual(data, [], `${label} : des lignes d'un autre compte sont visibles`)
  ok(label)
}

async function expectNoRows(query, label) {
  const { data, error } = await query
  assert.equal(error, null, `${label} : ${error?.message}`)
  assert.deepEqual(data ?? [], [], `${label} : une ligne d'un autre compte a été modifiée`)
  ok(label)
}

async function expectError(query, label) {
  const { error } = await query
  assert.ok(error, `${label} : l'opération aurait dû être refusée`)
  ok(label)
}

const cleanup = {
  groups: [],
  tasks: [],
  goals: [],
  domains: [],
  restDays: [],
  pauses: [],
  focus: [],
  subs: [],
}

async function cleanupAll() {
  // Défis partagés : B quitte, A supprime ses propres challenges actifs puis archive le groupe.
  for (const group of cleanup.groups) {
    await b.rpc('leave_shared_challenge', { p_group_id: group.id }).catch(() => {})
    const active = await a.from('active_challenges').select('id').eq('group_id', group.id)
    for (const row of active.data ?? []) {
      await a.from('tasks').delete().eq('challenge_active_id', row.id)
      await a.from('active_challenges').delete().eq('id', row.id)
    }
    await a.rpc('archive_shared_challenge', { p_group_id: group.id }).catch(() => {})
  }

  for (const id of cleanup.tasks) await a.from('tasks').delete().eq('id', id)
  for (const id of cleanup.goals) await a.from('goals').delete().eq('id', id)
  for (const id of cleanup.restDays) await a.from('rest_days').delete().eq('id', id)
  for (const id of cleanup.pauses) await a.from('pause_periods').delete().eq('id', id)
  for (const id of cleanup.focus) await a.from('focus_sessions').delete().eq('id', id)
  for (const endpoint of cleanup.subs) await a.from('push_subscriptions').delete().eq('endpoint', endpoint)
  for (const id of cleanup.domains) {
    // Chaque domaine appartient à A ou à B : on tente les deux clients (0 ligne si ce n'est pas le sien).
    await a.from('domains').delete().eq('id', id)
    await b.from('domains').delete().eq('id', id)
  }

  // Nettoyage facultatif des groupes (aucune politique DELETE pour les clients).
  if (serviceKey) {
    const admin = makeClient(serviceKey)
    for (const group of cleanup.groups) await admin.from('challenge_groups').delete().eq('id', group.id)
    for (const id of cleanup.domains) await admin.from('domains').delete().eq('id', id)
  }
}

const userA = await signIn(a, process.env.TEST_EMAIL_A, process.env.TEST_PASSWORD_A, 'A')
const userB = await signIn(b, process.env.TEST_EMAIL_B, process.env.TEST_PASSWORD_B, 'B')

try {
  section('Profil et tables personnelles')
  await expectEmpty(b.from('profiles').select('*').eq('id', userA.id), 'B ne lit pas le profil de A')
  await expectNoRows(
    b.from('profiles').update({ display_name: 'piraté' }).eq('id', userA.id).select(),
    'B ne modifie pas le profil de A',
  )

  const { data: domainA, error: domainAError } = await a.from('domains')
    .insert({ user_id: userA.id, name: `RLS A ${randomUUID().slice(0, 8)}`, color: DOMAIN_A })
    .select().single()
  assert.equal(domainAError, null, domainAError?.message)
  cleanup.domains.push(domainA.id)

  const { data: domainB, error: domainBError } = await b.from('domains')
    .insert({ user_id: userB.id, name: `RLS B ${randomUUID().slice(0, 8)}`, color: DOMAIN_B })
    .select().single()
  assert.equal(domainBError, null, domainBError?.message)
  cleanup.domains.push(domainB.id)
  ok('chaque compte crée son propre domaine')

  const { data: goalA, error: goalAError } = await a.from('goals')
    .insert({ user_id: userA.id, domain_id: domainA.id, title: 'Objectif privé A' })
    .select().single()
  assert.equal(goalAError, null, goalAError?.message)
  cleanup.goals.push(goalA.id)

  const { data: taskA, error: taskAError } = await a.from('tasks')
    .insert({ user_id: userA.id, domain_id: domainA.id, goal_id: goalA.id, title: 'Tâche privée A', scheduled_on: today })
    .select().single()
  assert.equal(taskAError, null, taskAError?.message)
  cleanup.tasks.push(taskA.id)

  await expectEmpty(b.from('goals').select('*').eq('id', goalA.id), 'B ne lit pas l’objectif de A')
  await expectEmpty(b.from('tasks').select('*').eq('id', taskA.id), 'B ne lit pas la tâche de A')
  await expectNoRows(
    b.from('tasks').update({ title: 'piraté' }).eq('id', taskA.id).select(),
    'B ne modifie pas la tâche de A',
  )
  await expectNoRows(
    b.from('tasks').delete().eq('id', taskA.id).select(),
    'B ne supprime pas la tâche de A',
  )

  const { data: stillThere } = await a.from('tasks').select('title').eq('id', taskA.id).single()
  assert.equal(stillThere.title, 'Tâche privée A', 'la tâche de A a été altérée')

  await expectError(
    b.from('tasks').insert({ user_id: userA.id, title: 'usurpation', scheduled_on: today }).select(),
    'B ne crée pas de tâche au nom de A',
  )
  await expectError(
    b.from('tasks').insert({ user_id: userB.id, domain_id: domainA.id, title: 'lien interdit', scheduled_on: today }).select(),
    'B ne rattache pas une tâche au domaine de A',
  )
  await expectError(
    b.from('goals').insert({ user_id: userB.id, domain_id: domainA.id, title: 'lien interdit' }).select(),
    'B ne rattache pas un objectif au domaine de A',
  )

  const { data: restA, error: restError } = await a.from('rest_days')
    .insert({ user_id: userA.id, day: day(-10) }).select().single()
  assert.equal(restError, null, restError?.message)
  cleanup.restDays.push(restA.id)
  await expectEmpty(b.from('rest_days').select('*').eq('id', restA.id), 'B ne lit pas les jours de repos de A')

  const { data: pauseA, error: pauseError } = await a.from('pause_periods')
    .insert({ user_id: userA.id, start_date: day(-12), end_date: day(-11), label: 'Pause A' })
    .select().single()
  assert.equal(pauseError, null, pauseError?.message)
  cleanup.pauses.push(pauseA.id)
  await expectEmpty(b.from('pause_periods').select('*').eq('id', pauseA.id), 'B ne lit pas les pauses de A')

  const { data: focusA, error: focusError } = await a.from('focus_sessions')
    .insert({ user_id: userA.id, minutes: 25, completed_on: today }).select().single()
  assert.equal(focusError, null, focusError?.message)
  cleanup.focus.push(focusA.id)
  await expectEmpty(b.from('focus_sessions').select('*').eq('id', focusA.id), 'B ne lit pas les sessions Focus de A')

  await expectError(
    b.rpc('record_focus_session', { p_minutes: 25, p_task_id: taskA.id, p_completed_on: today }),
    'la RPC Focus refuse la tâche de A',
  )

  const endpointA = `https://push.test/${randomUUID()}`
  const { error: subError } = await a.from('push_subscriptions')
    .insert({ user_id: userA.id, endpoint: endpointA, p256dh: 'BPub', auth: 'Auth' })
  assert.equal(subError, null, subError?.message)
  cleanup.subs.push(endpointA)
  await expectEmpty(
    b.from('push_subscriptions').select('*').eq('endpoint', endpointA),
    'B ne lit pas les abonnements push de A',
  )

  await expectEmpty(b.from('push_log').select('*'), 'push_log est inaccessible aux clients')
  await expectEmpty(anon.from('tasks').select('*'), 'le client anonyme ne lit aucune tâche')

  section('Défis partagés (migrations 010 et 011)')
  const { error: probeError } = await a.rpc('get_shared_challenge_preview', { p_code: 'INCONNU' })
  if (probeError && /does not exist|n'existe pas|Could not find/i.test(probeError.message)) {
    console.log('  ⚠️  migration 010 absente : tests des défis partagés ignorés.')
  } else {
    assert.equal(probeError, null, probeError?.message)

    const start = day(1)
    const end = day(7)
    const tasksFor = (from, prefix) => Array.from({ length: 7 }, (_, index) => ({
      title: `${prefix} ${index + 1}`,
      duration: '25 min',
      scheduled_on: (() => {
        const date = new Date(`${from}T00:00:00Z`)
        date.setUTCDate(date.getUTCDate() + index)
        return date.toISOString().slice(0, 10)
      })(),
      xp_value: 20,
      priority: 'medium',
    }))

    const { data: created, error: createError } = await a.rpc('create_shared_challenge', {
      p_title: `Défi RLS ${randomUUID().slice(0, 8)}`,
      p_description: 'Créé par le test RLS',
      p_color: DOMAIN_A,
      p_icon: 'flag',
      p_duration_days: 7,
      p_start_date: start,
      p_end_date: end,
      p_blueprints: [{ title: 'Programme' }],
      p_domain_id: domainA.id,
      p_tasks: tasksFor(start, 'A'),
    })
    assert.equal(createError, null, createError?.message)
    const group = created.group
    cleanup.groups.push(group)
    assert.match(group.join_code, /^[A-Z2-9]{8}$/, 'code d’invitation invalide')
    ok('A crée un défi partagé avec un code non devinable')

    await expectEmpty(
      b.from('challenge_groups').select('*').eq('id', group.id),
      'B ne lit pas le groupe avant d’y adhérer',
    )
    await expectEmpty(
      b.from('challenge_members').select('*').eq('group_id', group.id),
      'B ne lit pas les membres avant d’y adhérer',
    )
    await expectError(
      b.rpc('get_shared_challenge_leaderboard', { p_group_id: group.id }),
      'le classement est refusé aux non-membres',
    )

    const { data: preview, error: previewError } = await b.rpc('get_shared_challenge_preview', {
      p_code: group.join_code,
    })
    assert.equal(previewError, null, previewError?.message)
    assert.ok(preview?.group, 'aperçu introuvable')
    assert.equal(Object.hasOwn(preview.group, 'join_code'), false, 'l’aperçu ne doit jamais renvoyer le code')
    assert.equal(preview.alreadyMember, false)
    ok('l’aperçu ne divulgue pas le code d’invitation')

    const { data: joined, error: joinError } = await b.rpc('join_shared_challenge', {
      p_code: group.join_code,
      p_domain_id: domainB.id,
      p_tasks: tasksFor(start, 'B'),
    })
    assert.equal(joinError, null, joinError?.message)
    ok('B rejoint le défi avec un code valide')

    const members = await rows(b.from('challenge_members').select('*').eq('group_id', group.id), 'membres du groupe')
    assert.equal(members.length, 2, 'le groupe doit compter deux membres')
    const leaderboard = await rows(
      b.rpc('get_shared_challenge_leaderboard', { p_group_id: group.id }),
      'classement des membres',
    )
    assert.equal(leaderboard.length, 2, 'le classement doit compter deux membres')
    ok('les membres voient le classement, pas les non-membres')

    const bTasks = await rows(
      b.from('tasks').select('id,user_id,challenge_active_id').eq('challenge_active_id', joined.active.id),
      'tâches de B',
    )
    assert.equal(bTasks.length, 7)
    assert.ok(bTasks.every((task) => task.user_id === userB.id), 'B ne doit voir que ses propres tâches')
    const leakedTasks = await rows(
      b.from('tasks').select('id').eq('challenge_active_id', created.active.id),
      'tâches de A vues par B',
    )
    assert.deepEqual(leakedTasks, [], 'B ne voit pas les tâches de A dans le défi partagé')
    ok('chaque membre ne voit que ses propres tâches')

    await expectError(
      b.rpc('join_shared_challenge', {
        p_code: group.join_code,
        p_domain_id: domainB.id,
        p_tasks: tasksFor(start, 'B2'),
      }),
      'B ne peut pas rejoindre deux fois le même défi',
    )
    await expectError(
      b.rpc('archive_shared_challenge', { p_group_id: group.id }),
      'B ne peut pas archiver le défi de A',
    )
    await expectError(
      a.rpc('leave_shared_challenge', { p_group_id: group.id }),
      'l’organisateur ne peut pas quitter son défi',
    )

    // Adhésion tardive : le défi a commencé il y a deux jours.
    const lateStart = day(-2)
    const lateEnd = day(4)
    const lateTasks = (prefix) => Array.from({ length: 7 }, (_, index) => {
      const date = new Date(`${lateStart}T00:00:00Z`)
      date.setUTCDate(date.getUTCDate() + index)
      return { title: `${prefix} ${index + 1}`, scheduled_on: date.toISOString().slice(0, 10), xp_value: 20, priority: 'medium' }
    })
    const { data: lateCreated, error: lateCreateError } = await a.rpc('create_shared_challenge', {
      p_title: `Défi commencé ${randomUUID().slice(0, 8)}`,
      p_description: '',
      p_color: DOMAIN_A,
      p_icon: 'flag',
      p_duration_days: 7,
      p_start_date: lateStart,
      p_end_date: lateEnd,
      p_blueprints: [{ title: 'Programme' }],
      p_domain_id: domainA.id,
      p_tasks: lateTasks('Retard A'),
    })
    assert.equal(lateCreateError, null, lateCreateError?.message)
    cleanup.groups.push(lateCreated.group)

    const { error: lateJoinError } = await b.rpc('join_shared_challenge', {
      p_code: lateCreated.group.join_code,
      p_domain_id: domainB.id,
      p_tasks: lateTasks('Retard B'),
    })
    assert.ok(lateJoinError, 'migration 011 : un défi déjà commencé ne doit plus être rejoignable')
    ok('refuse l’adhésion après la date de démarrage')

    const { data: previewAfter } = await b.rpc('get_shared_challenge_preview', { p_code: group.join_code })
    assert.equal(previewAfter.alreadyMember, true)

    const { error: leaveError } = await b.rpc('leave_shared_challenge', { p_group_id: group.id })
    assert.equal(leaveError, null, leaveError?.message)
    const membersAfterLeave = await rows(
      b.from('challenge_members').select('*').eq('group_id', group.id),
      'membres après le départ de B',
    )
    assert.deepEqual(membersAfterLeave, [], 'B ne doit plus voir le groupe après l’avoir quitté')
    ok('B peut quitter le défi ; l’accès est immédiatement révoqué')
  }

  console.log(`\n✅ ${passed} contrôles de sécurité passés.`)
} finally {
  await cleanupAll().catch((error) => console.error('Nettoyage partiel :', error.message))
}
