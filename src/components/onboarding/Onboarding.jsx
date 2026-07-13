'use client'

import { useState } from 'react'
import { useStore } from '@/store'
import { DomainIcon } from '@/components/domain/DomainIcon'
import { hexToRgba, cn } from '@/lib/utils'
import { ArrowRight, CheckCircle2, Zap, Plus, Trash2 } from 'lucide-react'


const PRESET_DOMAINS = [
  { name: 'Trading',        icon: 'TrendingUp', color: '#00C2A8' },
  { name: 'Sport',          icon: 'Dumbbell',   color: '#FFB830' },
  { name: 'Études',         icon: 'BookOpen',   color: '#4EA8DE' },
  { name: 'Business',       icon: 'Briefcase',  color: '#7B61FF' },
  { name: 'Santé',          icon: 'Heart',      color: '#FF6B6B' },
  { name: 'Art & Créa',     icon: 'Palette',    color: '#A259FF' },
  { name: 'Développement',  icon: 'Code2',      color: '#1BC47D' },
  { name: 'Bien-être',      icon: 'Leaf',       color: '#0ACF83' },
]

export function Onboarding() {
  const { addDomain, addGoal, bulkAddTasks, domains, goals, completeOnboarding } = useStore()

  const [step, setStep] = useState('domains')
  const [selectedPresets, setSelectedPresets] = useState>(new Set())
  const [customDomain, setCustomDomain] = useState('')
  const [goalTitle, setGoalTitle] = useState('')
  const [goalDomainId, setGoalDomainId] = useState('')
  const [taskInputs, setTaskInputs] = useState(['', '', ''])

  const stepIndex = step === 'domains' ? 0 : step === 'goal' ? 1 : step === 'tasks' ? 2 : 3

  const handleNextDomains = () => {
    const toAdd = [...selectedPresets].map((i) => PRESET_DOMAINS[i])
    if (customDomain.trim()) {
      toAdd.push({ name: customDomain.trim(), icon: 'Star', color: DOMAIN_COLORS[3] })
    }
    toAdd.forEach((d) => addDomain(d))
    setGoalDomainId(domains[0]?.id || '')
    setStep('goal')
  }

  const handleNextGoal = () => {
    if (!goalTitle.trim()) return
    const d = goalDomainId || domains[0]?.id
    if (!d) return
    addGoal({ title: goalTitle.trim(), domainId: d, description: '' })
    setStep('tasks')
  }

  const handleFinish = () => {
    const g = goals[goals.length - 1]
    const d = goalDomainId || domains[0]?.id || ''
    const valid = taskInputs.filter((t) => t.trim())
    if (valid.length > 0 && g) {
      const today = new Date().toISOString().split('T')[0]
      bulkAddTasks(valid.map((title, i) => ({
        title: title.trim(),
        domainId: d,
        goalId: g.id,
        scheduledAt: `${today}T${(8 + i).toString().padStart(2, '0')}:00:00.000Z`,
        done: false,
        xpValue: 10,
        priority: 'medium' ,
      })))
    }
    completeOnboarding()
  }

  return (
    <div className="fixed inset-0 z-50 bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {['domains', 'goal', 'tasks'].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  'w-2 h-2 rounded-full transition-all duration-300',
                  i < stepIndex ? 'bg-success w-5' : i === stepIndex ? 'bg-accent w-5' : 'bg-border-2'
                )}
              />
            </div>
          ))}
        </div>

        {/* STEP 1 — Domains */}
        {step === 'domains' && (
          <div className="animate-scale-in">
            <div className="text-center mb-6">
              <p className="text-4xl mb-3">🌍</p>
              <h1 className="font-heading font-extrabold text-2xl text-content mb-2">
                Tes domaines de vie
              </h1>
              <p className="text-sm text-content-3 max-w-xs mx-auto">
                Choisis les sphères de ta vie sur lesquelles tu veux progresser.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {PRESET_DOMAINS.map((d, i) => {
                const active = selectedPresets.has(i)
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedPresets((prev) => {
                      const next = new Set(prev)
                      if (next.has(i)) next.delete(i); else next.add(i)
                      return next
                    })}
                    className={cn(
                      'flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all duration-150',
                      active
                        ? 'border-current'
                        : 'bg-bg-2 border-border hover:border-border-2'
                    )}
                    style={active ? {
                      background: hexToRgba(d.color, 0.12),
                      borderColor: d.color + '60',
                    } : {}}
                  >
                    <DomainIcon name={d.icon} size={16} color={active ? d.color : '#55556e'} />
                    <span className={cn('text-sm font-medium', active ? 'text-content' : 'text-content-2')}>
                      {d.name}
                    </span>
                    {active && <CheckCircle2 size={14} className="ml-auto flex-shrink-0" style={{ color: d.color }} />}
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-2 mb-5">
              <input
                className="flex-1 bg-bg-2 border border-border rounded-xl px-3 py-2 text-sm text-content placeholder:text-content-4 outline-none focus:border-accent/50"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="Autre domaine personnalisé…"
              />
            </div>

            <button
              onClick={handleNextDomains}
              disabled={selectedPresets.size === 0 && !customDomain.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm border transition-all disabled:opacity-40"
              style={{
                background: 'rgba(123,97,255,0.15)', borderColor: 'rgba(123,97,255,0.4)',
                color: '#7B61FF', boxShadow: '0 0 20px rgba(123,97,255,0.2)',
              }}
            >
              Continuer <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* STEP 2 — Objectif principal */}
        {step === 'goal' && (
          <div className="animate-scale-in">
            <div className="text-center mb-6">
              <p className="text-4xl mb-3">🎯</p>
              <h1 className="font-heading font-extrabold text-2xl text-content mb-2">
                Ton objectif principal
              </h1>
              <p className="text-sm text-content-3">
                Quel est l'objectif qui compte le plus pour toi en ce moment ?
              </p>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs text-content-3 font-medium block mb-1.5">Domaine</label>
                <div className="flex flex-wrap gap-2">
                  {domains.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setGoalDomainId(d.id)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all',
                        goalDomainId === d.id
                          ? 'text-white'
                          : 'bg-bg-2 border-border text-content-2 hover:border-border-2'
                      )}
                      style={goalDomainId === d.id ? { background: d.color, borderColor: d.color } : {}}
                    >
                      <DomainIcon name={d.icon} size={12} color={goalDomainId === d.id ? '#fff' : d.color} />
                      {d.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-content-3 font-medium block mb-1.5">Objectif</label>
                <input
                  className="w-full bg-bg-2 border border-border rounded-xl px-3 py-3 text-sm text-content placeholder:text-content-4 outline-none focus:border-accent/50"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="ex: Courir 5km sans s'arrêter"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') handleNextGoal() }}
                />
              </div>
            </div>

            <button
              onClick={handleNextGoal}
              disabled={!goalTitle.trim() || !goalDomainId}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm border transition-all disabled:opacity-40"
              style={{ background: 'rgba(123,97,255,0.15)', borderColor: 'rgba(123,97,255,0.4)', color: '#7B61FF' }}
            >
              Continuer <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* STEP 3 — Premières tâches */}
        {step === 'tasks' && (
          <div className="animate-scale-in">
            <div className="text-center mb-6">
              <p className="text-4xl mb-3">✅</p>
              <h1 className="font-heading font-extrabold text-2xl text-content mb-2">
                Tes premières tâches
              </h1>
              <p className="text-sm text-content-3">
                Que vas-tu faire aujourd'hui pour avancer vers ton objectif ?
              </p>
            </div>

            <div className="space-y-2 mb-5">
              {taskInputs.map((val, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-bg-3 border border-border flex items-center justify-center text-[10px] font-bold text-content-3 flex-shrink-0">
                    {i + 1}
                  </div>
                  <input
                    className="flex-1 bg-bg-2 border border-border rounded-xl px-3 py-2.5 text-sm text-content placeholder:text-content-4 outline-none focus:border-accent/50"
                    value={val}
                    onChange={(e) => setTaskInputs((prev) => prev.map((v, j) => j === i ? e.target.value : v))}
                    placeholder={`Tâche ${i + 1}…`}
                  />
                  {i > 0 && (
                    <button
                      onClick={() => setTaskInputs((prev) => prev.filter((_, j) => j !== i))}
                      className="text-content-4 hover:text-danger transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              {taskInputs.length < 5 && (
                <button
                  onClick={() => setTaskInputs((p) => [...p, ''])}
                  className="text-xs text-content-3 hover:text-content flex items-center gap-1 pl-8 transition-colors"
                >
                  <Plus size={12} /> Ajouter une tâche
                </button>
              )}
            </div>

            <button
              onClick={handleFinish}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm border transition-all"
              style={{
                background: 'rgba(0,194,168,0.15)', borderColor: 'rgba(0,194,168,0.4)',
                color: '#00C2A8', boxShadow: '0 0 20px rgba(0,194,168,0.2)',
              }}
            >
              <Zap size={16} fill="currentColor" /> Lancer FocusFlow !
            </button>

            <button
              onClick={handleFinish}
              className="w-full text-center text-xs text-content-4 hover:text-content-3 mt-3 transition-colors"
            >
              Passer cette étape →
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
