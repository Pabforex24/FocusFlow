import { useEffect, useRef, useState } from 'react'
import { MessageCircle, RotateCcw, Send, Sparkles } from 'lucide-react'
import Modal from '../components/Modal.jsx'
import { Button } from '../components/ui/Button.jsx'
import { PageHeader } from '../components/ui/PageHeader.jsx'
import { useData } from '../contexts/DataContext.jsx'
import { buildCoachAnalysis, COACH_PROMPTS, localCoachReply } from '../lib/coachAnalysis.js'
import { buildCoachContext } from '../lib/coachContext.js'
import { askCoach } from '../services/coachApi.js'
import { cn } from '../lib/cn.js'

const CHAT_KEY = 'focusflow-coach-chat'
const MAX_CHAT = 40

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

export default function Coach() {
  const data = useData()
  const analysis = buildCoachAnalysis(data)
  const [chatOpen, setChatOpen] = useState(false)
  const [chat, setChat] = useState(() => readChat(data.today))
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [aiOffline, setAiOffline] = useState(false)
  const listRef = useRef(null)

  useEffect(() => { setChat(readChat(data.today)) }, [data.today])
  useEffect(() => { saveChat(data.today, chat) }, [chat, data.today])
  useEffect(() => {
    if (!chatOpen) return
    const list = listRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [chat, sending, chatOpen])

  const intro = `Bonjour, moi c’est Amadou. ${analysis.summary} Dis-moi ce que tu veux organiser : une journée, un objectif, un défi ou un domaine.`

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
        <Button icon={MessageCircle} onClick={() => setChatOpen(true)}>Discuter avec Amadou</Button>
      </PageHeader>

      <section className="crystal-surface relative overflow-hidden rounded-3xl hero-surface p-5 text-white shadow-pop sm:p-8">
        <div className="pointer-events-none absolute -right-10 -bottom-10 z-0 size-44 rounded-full bg-white/10 blur-2xl" aria-hidden />
        <div className="relative z-10 flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/15"><Sparkles className="size-6" aria-hidden /></span>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-white/70 uppercase">
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-300" aria-hidden />
              Analyse automatique
            </p>
            <h2 className="mt-1 text-xl font-bold sm:text-2xl">{analysis.headline}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/85">{analysis.summary}</p>
          </div>
        </div>
      </section>

      {chatOpen && (
        <Modal title="Discuter avec Amadou" icon={MessageCircle} size="lg" onClose={() => setChatOpen(false)}>
          <div className="flex h-[min(62dvh,34rem)] flex-col">
            <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1" aria-live="polite">
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

            <div className="mt-3 border-t border-line pt-3">
              {chat.length === 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {COACH_PROMPTS.map((prompt) => (
                    <button key={prompt} type="button" onClick={() => sendMessage(prompt)} disabled={sending}
                      className="rounded-full border border-line bg-surface-2/60 px-2.5 py-1.5 text-left text-[11px] font-medium text-muted transition hover:border-brand-400/50 hover:text-fg disabled:opacity-50">
                      {prompt}
                    </button>
                  ))}
                </div>
              )}
              <form onSubmit={(event) => { event.preventDefault(); sendMessage(input) }} className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      event.currentTarget.form?.requestSubmit()
                    }
                  }}
                  rows={2}
                  maxLength={1000}
                  autoFocus
                  placeholder="Ex. Aide-moi à organiser demain sans surcharger la journée…"
                  aria-label="Message à Amadou"
                  className="max-h-32 min-h-11 flex-1 resize-none py-2.5"
                />
                <Button type="submit" icon={Send} loading={sending} disabled={!input.trim()} className="h-11 px-3.5">Envoyer</Button>
              </form>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-subtle">
                <span>{aiOffline ? 'IA indisponible : réponses locales actives.' : 'Amadou conseille, il ne modifie pas tes données.'}</span>
                <span className="inline-flex items-center gap-3">
                  <span>{chat.length}/{MAX_CHAT}</span>
                  {chat.length > 0 && (
                    <button type="button" onClick={clearChat} className="inline-flex items-center gap-1 font-medium hover:text-fg">
                      <RotateCcw className="size-3" aria-hidden />Effacer
                    </button>
                  )}
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
