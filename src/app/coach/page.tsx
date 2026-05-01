'use client'

import { useState, useRef, useEffect } from 'react'
import { Sparkles, Send, RefreshCw, MessageSquare } from 'lucide-react'
import { useStore } from '@/store'
import { getRandomQuote, getWeekActivity, hexToRgba } from '@/lib/utils'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { InsightCard } from '@/components/coach/InsightCard'
import { WeekChart } from '@/components/coach/WeekChart'
import { inputCls } from '@/components/ui/Modal'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function CoachPage() {
  const { domains, goals, tasks, streak, getDomainProgress, getGlobalProgress } = useStore()
  const [insights, setInsights] = useState<React.ReactNode | null>(null)
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const buildContext = () => {
    const today = new Date().toDateString()
    const todayTasks = tasks.filter((t) => new Date(t.scheduledAt).toDateString() === today)
    const todayDone = todayTasks.filter((t) => t.done)
    const globalPct = getGlobalProgress()
    const domainsData = domains.map((d) => ({
      name: d.name,
      pct: getDomainProgress(d.id),
    }))
    return { todayDone: todayDone.length, totalToday: todayTasks.length, globalPct, streak, domainsData }
  }

  const generateInsights = async () => {
    setInsightsLoading(true)
    const ctx = buildContext()
    await new Promise((r) => setTimeout(r, 600)) // simulate loading

    const completion = ctx.totalToday > 0 ? Math.round((ctx.todayDone / ctx.totalToday) * 100) : 0
    const weakDomain = [...ctx.domainsData].sort((a, b) => a.pct - b.pct)[0]
    const strongDomain = [...ctx.domainsData].sort((a, b) => b.pct - a.pct)[0]

    let perfIcon = '🏆'
    let perfMsg = ''
    if (completion >= 80) perfMsg = 'Excellente journée ! Vous êtes dans le top de votre discipline.'
    else if (completion >= 50) { perfMsg = 'Bonne progression. Continuez sur cette lancée pour finir fort.'; perfIcon = '📈' }
    else if (ctx.totalToday === 0) { perfMsg = 'Aucune tâche planifiée aujourd\'hui. Pensez à organiser demain dès maintenant.'; perfIcon = '💡' }
    else { perfMsg = 'La journée n\'est pas finie ! Concentrez-vous sur les tâches essentielles restantes.'; perfIcon = '⚡' }

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
                <li>
                  <strong>Priorité :</strong> Le domaine "{weakDomain.name}" ({weakDomain.pct}%) mérite plus d'attention cette semaine.
                </li>
              )}
              {strongDomain && strongDomain.pct > 60 && (
                <li>
                  <strong>Point fort :</strong> "{strongDomain.name}" progresse bien ({strongDomain.pct}%). Capitalisez dessus.
                </li>
              )}
              {ctx.streak >= 3 ? (
                <li>
                  <strong>Streak :</strong> {ctx.streak} jours consécutifs ! Ne cassez pas la chaîne ce soir.
                </li>
              ) : (
                <li>
                  Completez au moins une tâche aujourd'hui pour démarrer ou maintenir votre série.
                </li>
              )}
              {goals.length === 0 && <li>Créez votre premier objectif pour commencer à mesurer votre progression.</li>}
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

  const sendChat = async () => {
    const msg = chatInput.trim()
    if (!msg || chatLoading) return
    setChatInput('')
    const userMsg: ChatMessage = { role: 'user', content: msg }
    setChatMessages((prev) => [...prev, userMsg])
    setChatLoading(true)

    const ctx = buildContext()
    const systemPrompt = `Tu es un coach personnel de productivité et discipline dans l'application FocusFlow.
Données utilisateur: ${domains.length} domaines, ${goals.length} objectifs, streak de ${ctx.streak} jours, progression globale ${ctx.globalPct}%.
Domaines: ${ctx.domainsData.map((d) => `${d.name}(${d.pct}%)`).join(', ')}.
Réponds en français, de manière concise, motivante et pratique. Maximum 3 phrases.`

    try {
      const resp = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatMessages, userMsg].map((m) => ({ role: m.role, content: m.content })),
          system: systemPrompt,
        }),
      })
      const data = await resp.json()
      setChatMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
    } catch {
      // Fallback
      const fallback = getFallbackReply(msg, ctx)
      setChatMessages((prev) => [...prev, { role: 'assistant', content: fallback }])
    }
    setChatLoading(false)
  }

  const getFallbackReply = (msg: string, ctx: ReturnType<typeof buildContext>) => {
    const m = msg.toLowerCase()
    if (m.includes('motiv')) return `La motivation ne dure pas, mais les habitudes si. ${getRandomQuote()}`
    if (m.includes('procrastin')) return 'Pour vaincre la procrastination : démarrez avec 2 minutes. L\'action crée l\'élan, pas l\'inverse.'
    if (m.includes('streak')) return `Votre streak actuel est de ${ctx.streak} jours. Chaque jour compte — ne cassez pas la chaîne !`
    if (m.includes('objectif')) return `Vous avez ${goals.length} objectif(s) actif(s). Concentrez-vous sur un seul à la fois.`
    return `Je suis votre coach de discipline. ${getRandomQuote()}`
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto page-enter">
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
            {insightsLoading ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Sparkles size={14} />
            )}
            Analyser mes performances
          </Button>
          <Button variant="outline" onClick={() => document.getElementById('chat-section')?.scrollIntoView({ behavior: 'smooth' })}>
            <MessageSquare size={14} />
            Poser une question
          </Button>
        </div>
      </div>

      {/* Insights */}
      {insightsLoading && (
        <InsightCard icon="⏳" title="Analyse en cours…">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-accent animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
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
          <div className="flex items-center gap-1.5 text-xs text-content-3">
            <div className="w-3 h-3 rounded bg-bg-4" />
            Total
          </div>
          <div className="flex items-center gap-1.5 text-xs text-content-3">
            <div className="w-3 h-3 rounded bg-accent" />
            Complétées
          </div>
        </div>
      </div>

      {/* Chat section */}
      <div id="chat-section" className="bg-bg-2 border border-border rounded-2xl p-5">
        <h2 className="font-heading font-bold text-base mb-4 flex items-center gap-2">
          <MessageSquare size={16} className="text-accent" />
          Discuter avec votre coach
        </h2>

        {/* Messages */}
        <div className="min-h-[100px] max-h-[300px] overflow-y-auto flex flex-col gap-3 mb-4">
          {chatMessages.length === 0 && (
            <div className="text-center py-8 text-content-3 text-sm">
              Posez une question sur votre productivité, votre discipline ou vos objectifs…
            </div>
          )}
          {chatMessages.map((msg, i) => (
            <div
              key={i}
              className={`px-4 py-3 rounded-xl text-sm leading-relaxed max-w-[85% ${
                msg.role === 'user'
                  ? 'self-end bg-accent/20 border border-accent/30 text-content'
                  : 'self-start bg-bg-3 border border-border text-content-2'
              }`}
              style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
            >
              {msg.content}
            </div>
          ))}
          {chatLoading && (
            <div className="self-start px-4 py-3 rounded-xl bg-bg-3 border border-border flex gap-1.5 items-center">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-content-3 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            className={inputCls + ' flex-1'}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendChat()}
            placeholder="Posez une question à votre coach…"
            disabled={chatLoading}
          />
          <Button variant="primary" onClick={sendChat} disabled={!chatInput.trim() || chatLoading}>
            <Send size={15} />
          </Button>
        </div>
      </div>
    </div>
  )
}
