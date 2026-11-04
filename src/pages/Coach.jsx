import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { ArrowRight, MessageCircle, RotateCcw, Send, Sparkles, Target, TrendingUp, TriangleAlert, X } from 'lucide-react'
import { Button, IconButton } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { PageHeader } from '../components/ui/PageHeader.jsx'
import { useData } from '../contexts/DataContext.jsx'
import { buildCoachAnalysis, COACH_PROMPTS, localCoachReply } from '../lib/coachAnalysis.js'
import { buildCoachContext } from '../lib/coachContext.js'
import { askCoach } from '../services/coachApi.js'
import { cn } from '../lib/cn.js'
import { useFocusTrap } from '../lib/useFocusTrap.js'
import { useScrollLock } from '../lib/useScrollLock.js'

const CHAT_KEY = 'focusflow-coach-chat'
const MAX_CHAT = 40
const timeFormat = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })

function readChat(day) {
  try {
    const saved = JSON.parse(localStorage.getItem(CHAT_KEY))
    return saved?.day === day && Array.isArray(saved.messages) ? saved.messages.slice(-MAX_CHAT) : []
  } catch {
    return []
  }
}

function saveChat(day, messages) {
  try { localStorage.setItem(CHAT_KEY, JSON.stringify({ day, messages: messages.slice(-MAX_CHAT) })) } catch { /* stockage indisponible */ }
}

const messageId = () => globalThis.crypto?.randomUUID?.() ?? `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

function CoachAvatar({ small = false }) {
  return (
    <span className={cn('grid shrink-0 place-items-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-300', small ? 'size-7' : 'size-10')}>
      <Sparkles className={small ? 'size-3.5' : 'size-5'} aria-hidden />
    </span>
  )
}

function ChatDialog({ chat, intro, input, sending, aiOffline, onClose, onInput, onSend, onPrompt, onClear }) {
  const dialogRef = useRef(null)
  const listRef = useRef(null)
  useFocusTrap(dialogRef)
  useScrollLock()

  useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    const list = listRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [chat, sending])

  return createPortal(
    <div className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="coach-chat-title" tabIndex={-1}
        className="flex h-[100dvh] w-full flex-col overflow-hidden bg-surface sm:h-[min(82dvh,44rem)] sm:max-w-2xl sm:rounded-3xl sm:border sm:border-line sm:shadow-pop">
        <header className="flex shrink-0 items-center gap-3 border-b border-line px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 sm:px-6 sm:pt-5 sm:pb-4">
          <CoachAvatar />
          <div className="min-w-0 flex-1">
            <h2 id="coach-chat-title" className="font-display text-base font-semibold tracking-tight text-fg">Amadou</h2>
            <p className="truncate text-xs text-muted">Coach personnel</p>
          </div>
          <IconButton icon={X} label="Fermer" size="sm" onClick={onClose} className="-mr-1" />
        </header>

        <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6" aria-live="polite">
          <div className="flex items-start gap-2">
            <CoachAvatar small />
            <div className="max-w-[88%] rounded-2xl rounded-tl-md bg-surface-2 px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line text-fg">{intro}</div>
          </div>
          {chat.map((message) => (
            <div key={message.id} className={cn('flex items-start gap-2', message.role === 'user' && 'justify-end')}>
              {message.role === 'coach' && <CoachAvatar small />}
              <div className={cn('max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line',
                message.role === 'user' ? 'rounded-tr-md bg-brand-600 text-white' : 'rounded-tl-md bg-surface-2 text-fg')}>
                {message.text}
                {message.role === 'coach' && message.source === 'local' && <span className="mt-1.5 block text-[10px] font-medium text-subtle">Conseil local</span>}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex items-start gap-2">
              <CoachAvatar small />
              <div className="rounded-2xl rounded-tl-md bg-surface-2 px-3.5 py-2.5 text-sm text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-1.5 animate-bounce rounded-full bg-brand-400 [animation-delay:-0.2s]" aria-hidden />
                  <span className="size-1.5 animate-bounce rounded-full bg-brand-400 [animation-delay:-0.1s]" aria-hidden />
                  <span className="size-1.5 animate-bounce rounded-full bg-brand-400" aria-hidden />
                  Amadou réfléchit…
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-line bg-surface px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-4">
          {chat.length === 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {COACH_PROMPTS.map((prompt) => (
                <button key={prompt} type="button" onClick={() => onPrompt(prompt)} disabled={sending}
                  className="rounded-full border border-line bg-surface-2/60 px-2.5 py-1.5 text-left text-[11px] font-medium text-muted transition hover:border-brand-400/50 hover:text-fg disabled:opacity-50">
                  {prompt}
                </button>
              ))}
            </div>
          )}
          <form onSubmit={(event) => { event.preventDefault(); onSend(input) }} className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(event) => onInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  event.currentTarget.form?.requestSubmit()
                }
              }}
              rows={1}
              maxLength={1000}
              placeholder="Écris à Amadou…"
              aria-label="Message à Amadou"
              className="h-11 max-h-24 flex-1 resize-none py-2.5"
            />
            <Button type="submit" icon={Send} loading={sending} disabled={!input.trim()} aria-label="Envoyer" className="size-11 shrink-0 px-0 sm:w-auto sm:px-3.5">
              <span className="sr-only sm:not-sr-only">Envoyer</span>
            </Button>
          </form>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-subtle">
            <span>{aiOffline ? 'IA indisponible : réponses locales actives.' : 'Amadou ne modifie pas tes données.'}</span>
            {chat.length > 0 && (
              <button type="button" onClick={onClear} className="inline-flex items-center gap-1 font-medium hover:text-fg">
                <RotateCcw className="size-3" aria-hidden />Effacer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default function Coach() {
  const data = useData()
  const analysis = buildCoachAnalysis(data)
  const [chatOpen, setChatOpen] = useState(false)
  const [chat, setChat] = useState(() => readChat(data.today))
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [aiOffline, setAiOffline] = useState(false)
  const [insightIndex, setInsightIndex] = useState(0)
  const [refreshedAt, setRefreshedAt] = useState(() => new Date())
  const [, setAnalysisTick] = useState(0)

  useEffect(() => { setChat(readChat(data.today)) }, [data.today])
  useEffect(() => { saveChat(data.today, chat) }, [chat, data.today])
  useEffect(() => {
    const id = setInterval(() => {
      setAnalysisTick((tick) => tick + 1)
      setRefreshedAt(new Date())
    }, 30_000)
    return () => clearInterval(id)
  }, [])
  useEffect(() => {
    const id = setInterval(() => setInsightIndex((index) => index + 1), 15_000)
    return () => clearInterval(id)
  }, [])

  const insights = [
    { icon: TrendingUp, label: 'Élan', text: analysis.momentum.text, tone: 'text-emerald-500' },
    { icon: TriangleAlert, label: 'À surveiller', text: analysis.risk.text, tone: 'text-amber-500' },
    { icon: Target, label: 'Domaines', text: analysis.balance.text, tone: 'text-brand-500' },
  ]
  const insight = insights[insightIndex % insights.length]
  const InsightIcon = insight.icon
  const intro = `Bonjour, moi c’est Amadou. ${analysis.summary}`

  const sendMessage = async (raw) => {
    const text = String(raw ?? '').trim().slice(0, 1000)
    if (!text || sending) return
    const next = [...chat, { id: messageId(), role: 'user', text, at: Date.now() }]
    setChat(next)
    setInput('')
    setSending(true)
    try {
      const reply = await askCoach(buildCoachContext(data), {
        mode: 'chat',
        messages: next.map((message) => ({ role: message.role === 'user' ? 'user' : 'assistant', content: message.text })),
      })
      setChat((current) => [...current, { id: messageId(), role: 'coach', text: reply, source: 'ai', at: Date.now() }])
      setAiOffline(false)
    } catch {
      const reply = localCoachReply(text, data, analysis)
      setChat((current) => [...current, { id: messageId(), role: 'coach', text: reply, source: 'local', at: Date.now() }])
      setAiOffline(true)
    } finally {
      setSending(false)
    }
  }

  const clearChat = () => {
    setChat([])
    setAiOffline(false)
    try { localStorage.removeItem(CHAT_KEY) } catch { /* stockage indisponible */ }
  }

  return (
    <>
      <PageHeader title="Coach Amadou">
        <Button icon={MessageCircle} onClick={() => setChatOpen(true)}>Discuter</Button>
      </PageHeader>

      <div className="space-y-4">
        <section className="crystal-surface relative overflow-hidden rounded-3xl hero-surface p-5 text-white shadow-pop sm:p-8">
          <div className="pointer-events-none absolute -right-10 -bottom-10 z-0 size-44 rounded-full bg-white/10 blur-2xl" aria-hidden />
          <div className="relative z-10 flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/15"><Sparkles className="size-6" aria-hidden /></span>
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold tracking-wide text-white/70 uppercase">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-1.5 animate-pulse rounded-full bg-emerald-300" aria-hidden />
                  Analyse automatique
                </span>
                <span className="text-white/35">·</span>
                <span className="normal-case tracking-normal text-white/55">toutes les 30 s</span>
              </p>
              <h2 key={refreshedAt.getTime()} className="mt-1 animate-fade-in text-xl font-bold sm:text-2xl">{analysis.headline}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/85">{analysis.summary}</p>
            </div>
          </div>
          <p className="relative z-10 mt-4 border-t border-white/10 pt-3 text-[11px] text-white/55">Actualisé à {timeFormat.format(refreshedAt)}</p>
        </section>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card className="flex flex-col">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-300"><Target className="size-5" aria-hidden /></span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold tracking-wide text-subtle uppercase">Maintenant</p>
                <p className="mt-1 text-sm leading-relaxed text-fg">{analysis.focus.text}</p>
              </div>
            </div>
            <Link to={analysis.focus.to} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline dark:text-brand-300">
              {analysis.focus.cta}<ArrowRight className="size-4" aria-hidden />
            </Link>
          </Card>

          <Card className="flex flex-col" data-coach-insight={insight.label}>
            <div className="flex items-start gap-3">
              <span className={cn('grid size-9 shrink-0 place-items-center rounded-xl bg-surface-2', insight.tone)}><InsightIcon className="size-5" aria-hidden /></span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold tracking-wide text-subtle uppercase">{insight.label}</p>
                <p className="mt-1 text-sm leading-relaxed text-fg">{insight.text}</p>
              </div>
            </div>
            <div className="mt-auto flex items-center justify-between gap-3 pt-4">
              <div className="flex items-center gap-1.5">
                {insights.map((item, index) => {
                  const active = index === insightIndex % insights.length
                  return (
                    <button key={item.label} type="button" onClick={() => setInsightIndex(index)}
                      aria-label={`Afficher ${item.label}`} aria-pressed={active}
                      className={cn('h-1.5 rounded-full transition-all', active ? 'w-5 bg-brand-500' : 'w-1.5 bg-line hover:bg-brand-400')} />
                  )
                })}
              </div>
              <span className="text-[11px] text-subtle">Auto · 15 s</span>
            </div>
          </Card>
        </div>
      </div>

      {chatOpen && (
        <ChatDialog
          chat={chat}
          intro={intro}
          input={input}
          sending={sending}
          aiOffline={aiOffline}
          onClose={() => setChatOpen(false)}
          onInput={setInput}
          onSend={sendMessage}
          onPrompt={sendMessage}
          onClear={clearChat}
        />
      )}
    </>
  )
}
