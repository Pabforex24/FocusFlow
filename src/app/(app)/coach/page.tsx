'use client'

export const dynamic = 'force-dynamic'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Sparkles, Send, RefreshCw, MessageSquare, Trash2 } from 'lucide-react'
import { useStore } from '@/store'
import { useGlobalProgress, useAllDomainProgress } from '@/store/selectors'
import { getRandomQuote } from '@/lib/utils'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button }     from '@/components/ui/Button'
import { InsightCard } from '@/components/coach/InsightCard'
import { WeekChart }   from '@/components/coach/WeekChart'
import { inputCls }    from '@/components/ui/Modal'

interface ChatMessage {
  role:      'user' | 'assistant'
  content:   string
  streaming?: boolean
}

const STORAGE_KEY = 'focusflow-coach-history'
const MAX_HISTORY = 20

export default function CoachPage() {
  const { domains, goals, tasks, streak } = useStore()

  // Sélecteurs mémoïsés
  const globalPct      = useGlobalProgress()
  const domainProgress = useAllDomainProgress()

  const [insights,        setInsights]        = useState<React.ReactNode | null>(null)
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [chatInput,       setChatInput]       = useState('')
  const [chatLoading,     setChatLoading]     = useState(false)

  // Historique persisté dans localStorage
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })

  // Sauvegarde à chaque changement (hors streaming)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const toSave = chatMessages.filter((m) => !m.streaming).slice(-MAX_HISTORY)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)) } catch {}
  }, [chatMessages])

  const clearHistory = () => {
    setChatMessages([])
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
  }

  const chatEndRef  = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef    = useRef<AbortController | null>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }, [])
  useEffect(() => { resizeTextarea() }, [chatInput, resizeTextarea])

  const buildContext = useCallback(() => {
    const todayStr   = new Date().toDateString()
    const todayTasks = tasks.filter((t) => new Date(t.scheduledAt).toDateString() === todayStr)
    const todayDone  = todayTasks.filter((t) => t.done)
    return {
      todayDone:    todayDone.length,
      totalToday:   todayTasks.length,
      globalPct,
      streak,
      domainsData:  domains.map((d) => ({ name: d.name, pct: domainProgress[d.id] ?? 0 })),
      pendingTasks: tasks
        .filter((t) => !t.done && new Date(t.scheduledAt).toDateString() === todayStr)
        .map((t) => t.title)
        .slice(0, 5),
      goalTitles: goals.map((g) => g.title).slice(0, 5),
    }
  }, [tasks, goals, domains, streak, globalPct, domainProgress])

  // ── Insights ────────────────────────────────────────────────────────────────
  const generateInsights = async () => {
    setInsightsLoading(true)
    const ctx = buildContext()
    await new Promise((r) => setTimeout(r, 400))

    const completion   = ctx.totalToday > 0 ? Math.round((ctx.todayDone / ctx.totalToday) * 100) : 0
    const weakDomain   = [...ctx.domainsData].sort((a, b) => a.pct - b.pct)[0]
    const strongDomain = [...ctx.domainsData].sort((a, b) => b.pct - a.pct)[0]

    let perfIcon = '🏆', perfMsg = ''
    if (completion >= 80)          perfMsg = 'Excellente journée ! Vous êtes dans le top de votre discipline.'
    else if (completion >= 50)   { perfMsg = 'Bonne progression. Continuez sur cette lancée pour finir fort.'; perfIcon = '📈' }
    else if (ctx.totalToday === 0) { perfMsg = "Aucune tâche planifiée aujourd'hui. Pensez à organiser demain dès maintenant."; perfIcon = '💡' }
    else                         { perfMsg = "La journée n'est pas finie ! Concentrez-vous sur les tâches essentielles restantes."; perfIcon = '⚡' }

    setInsights(
      <>
        <InsightCard icon={perfIcon} title="Performance du jour">
          <p>{perfMsg}</p>
          <div className="flex gap-6 mt-4">
            <div>
              <div className="font-heading font-extrabold text-2xl text-success">{completion}%</div>
              <div className="text-[10px] text-content-3">Tâches complétées</div>
            </div>
            <div>
              <div className="font-heading font-extrabold text-2xl text-warning">{ctx.streak}🔥</div>
              <div className="text-[10px] text-content-3">Streak actuel</div>
            </div>
            <div>
              <div className="font-heading font-extrabold text-2xl text-accent">{ctx.globalPct}%</div>
              <div className="text-[10px] text-content-3">Progression globale</div>
            </div>
          </div>
        </InsightCard>

        {ctx.domainsData.length > 0 && (
          <InsightCard icon="🎯" title="Recommandations">
            <ul className="space-y-1.5 list-disc list-inside">
              {weakDomain && weakDomain.pct < 50 && (
                <li><strong>Priorité :</strong> Le domaine "{weakDomain.name}" ({weakDomain.pct}%) mérite plus d'attention.</li>
              )}
              {strongDomain && strongDomain.pct > 60 && (
                <li><strong>Point fort :</strong> "{strongDomain.name}" progresse bien ({strongDomain.pct}%).</li>
              )}
              {ctx.streak >= 3
                ? <li><strong>Streak :</strong> {ctx.streak} jours consécutifs ! Ne cassez pas la chaîne.</li>
                : <li>Complétez au moins une tâche aujourd'hui pour démarrer votre série.</li>
              }
              {goals.length === 0 && <li>Créez votre premier objectif pour mesurer votre progression.</li>}
            </ul>
          </InsightCard>
        )}

        <InsightCard icon="💡" title="Citation du coach">
          <p className="italic">{getRandomQuote()}</p>
        </InsightCard>
      </>
    )
    setInsightsLoading(false)
  }

  // ── Chat streaming ───────────────────────────────────────────────────────────
  const getLocalFallback = (msg: string, ctx: ReturnType<typeof buildContext>) => {
    const m = msg.toLowerCase()
    if (m.includes('motiv'))      return `La motivation ne dure pas, mais les habitudes si. ${getRandomQuote()}`
    if (m.includes('procrastin')) return "Pour vaincre la procrastination : démarrez avec 2 minutes. L'action crée l'élan."
    if (m.includes('streak'))     return `Votre streak actuel est de ${ctx.streak} jours. Ne cassez pas la chaîne !`
    if (m.includes('objectif'))   return `Vous avez ${goals.length} objectif(s) actif(s). Concentrez-vous sur un seul à la fois.`
    return `Je suis votre coach de discipline. ${getRandomQuote()}`
  }

  const sendChat = async () => {
    const msg = chatInput.trim()
    if (!msg || chatLoading) return

    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setChatInput('')
    const userMsg: ChatMessage = { role: 'user', content: msg }
    setChatMessages((prev) => [...prev, userMsg])
    setChatLoading(true)

    const ctx = buildContext()
    const systemPrompt = `Tu es un coach personnel de productivité et discipline dans FocusFlow.
Données utilisateur : ${domains.length} domaines, ${goals.length} objectifs, streak de ${ctx.streak} jours, progression globale ${ctx.globalPct}%.
Domaines : ${ctx.domainsData.map((d) => `${d.name}(${d.pct}%)`).join(', ')}.
Tâches du jour non faites : ${ctx.pendingTasks.length > 0 ? ctx.pendingTasks.join(', ') : 'aucune'}.
Objectifs actifs : ${ctx.goalTitles.length > 0 ? ctx.goalTitles.join(', ') : 'aucun'}.
Réponds en français, de façon concise, motivante et pratique. Maximum 4 phrases.`

    setChatMessages((prev) => [...prev, { role: 'assistant', content: '', streaming: true }])

    try {
      const resp = await fetch('/api/coach', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        signal:  abortRef.current.signal,
        body: JSON.stringify({
          messages: [...chatMessages, userMsg].map((m) => ({ role: m.role, content: m.content })),
          system:   systemPrompt,
        }),
      })

      // Fallback JSON (pas de clé, rate limit…)
      if (resp.headers.get('content-type')?.includes('application/json')) {
        const data = await resp.json()
        setChatMessages((prev) => [
          ...prev.slice(0, -1),
          { role: 'assistant', content: data.reply || '...', streaming: false },
        ])
        setChatLoading(false)
        return
      }

      // Stream SSE
      const reader  = resp.body!.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n')) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data:')) continue
          const data = trimmed.slice(5).trim()
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            if (parsed.token) {
              fullContent += parsed.token
              setChatMessages((prev) => [
                ...prev.slice(0, -1),
                { role: 'assistant', content: fullContent, streaming: true },
              ])
            }
          } catch { /* chunk partiel */ }
        }
      }

      setChatMessages((prev) => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: fullContent, streaming: false },
      ])

    } catch (err: any) {
      if (err?.name === 'AbortError') return
      setChatMessages((prev) => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: getLocalFallback(msg, ctx), streaming: false },
      ])
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <div className="px-4 pt-4 md:p-8 max-w-3xl mx-auto mt-[calc(env(safe-area-inset-top)+52px)] md:mt-0 page-enter">
      <PageHeader title="IA Coach" subtitle="Analyse · Suggestions · Motivation" />

      {/* Hero */}
      <div className="text-center bg-gradient-to-b from-accent/10 to-transparent border border-accent/20 rounded-2xl p-8 mb-8">
        <div className="text-5xl mb-3">🤖</div>
        <h2 className="font-heading font-extrabold text-xl mb-2">Votre Coach Personnel</h2>
        <p className="text-content-2 text-sm mb-5">
          Analyse vos performances · Suggère des améliorations · Vous motive
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Button variant="primary" onClick={generateInsights} disabled={insightsLoading}>
            {insightsLoading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Analyser mes performances
          </Button>
          <Button variant="outline" onClick={() => document.getElementById('chat-section')?.scrollIntoView({ behavior: 'smooth' })}>
            <MessageSquare size={14} />
            Poser une question
            {chatMessages.length > 0 && (
              <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(123,94,167,0.3)', color: 'var(--color-accent)' }}>
                {chatMessages.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Insights */}
      {insightsLoading && (
        <InsightCard icon="⏳" title="Analyse en cours…">
          <div className="flex gap-1.5">
            {[0,1,2].map((i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </InsightCard>
      )}
      {insights && !insightsLoading && insights}

      {/* Week chart */}
      <h2 className="font-heading font-bold text-sm uppercase tracking-widest text-content-2 mb-4">
        Activité — 7 derniers jours
      </h2>
      <div className="bg-bg-2 border border-border rounded-xl p-5 mb-8">
        <WeekChart tasks={tasks} />
        <div className="flex items-center gap-4 mt-4 justify-end">
          <div className="flex items-center gap-1.5 text-xs text-content-3"><div className="w-3 h-3 rounded bg-bg-4" />Total</div>
          <div className="flex items-center gap-1.5 text-xs text-content-3"><div className="w-3 h-3 rounded bg-accent" />Complétées</div>
        </div>
      </div>

      {/* Chat */}
      <div id="chat-section" className="bg-bg-2 border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-base flex items-center gap-2">
            <MessageSquare size={16} className="text-accent" />
            Discuter avec votre coach
          </h2>
          {chatMessages.length > 0 && (
            <button
              onClick={clearHistory}
              className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg transition-all opacity-60 hover:opacity-100"
              style={{ color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)' }}
            >
              <Trash2 size={11} /> Effacer
            </button>
          )}
        </div>

        <div className="min-h-[100px] max-h-[360px] overflow-y-auto flex flex-col gap-3 mb-4">
          {chatMessages.length === 0 && (
            <div className="text-center py-8 text-content-3 text-sm space-y-1">
              <MessageSquare size={28} className="mx-auto mb-3 opacity-20" />
              <p>Posez une question sur votre productivité,</p>
              <p>votre discipline ou vos objectifs…</p>
            </div>
          )}
          {chatMessages.map((msg, i) => (
            <div key={i}
              className="px-4 py-3 rounded-xl text-sm leading-relaxed max-w-[85%]"
              style={{
                alignSelf:  msg.role === 'user' ? 'flex-end' : 'flex-start',
                background: msg.role === 'user' ? 'rgba(123,94,167,0.18)' : 'rgba(255,255,255,0.04)',
                border:     msg.role === 'user' ? '1px solid rgba(123,94,167,0.30)' : '1px solid rgba(255,255,255,0.07)',
                color:      msg.role === 'user' ? 'var(--color-content)' : 'var(--color-content-2)',
              }}
            >
              {msg.content}
              {msg.streaming && (
                <span className="inline-block w-[2px] h-[14px] ml-0.5 align-middle animate-pulse"
                  style={{ background: 'var(--color-accent)', borderRadius: '1px' }} />
              )}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            className={inputCls + ' flex-1 resize-none overflow-hidden leading-relaxed'}
            value={chatInput}
            rows={1}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat() } }}
            placeholder="Écrivez votre message… (Shift+Entrée pour sauter une ligne)"
            disabled={chatLoading}
            style={{ minHeight: '40px', maxHeight: '160px' }}
          />
          <Button variant="primary" onClick={sendChat} disabled={!chatInput.trim() || chatLoading}>
            {chatLoading ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
          </Button>
        </div>
      </div>
    </div>
  )
}
