import { NextRequest, NextResponse } from 'next/server'

// ── Rate limiting ─────────────────────────────────────────────────────────────
const WINDOW_MS = 60_000
const MAX_REQ   = 20
interface RateEntry { count: number; windowStart: number }
const rateLimitMap = new Map<string, RateEntry>()

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now   = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now })
    return { allowed: true, remaining: MAX_REQ - 1, resetIn: WINDOW_MS }
  }
  if (entry.count >= MAX_REQ) {
    return { allowed: false, remaining: 0, resetIn: WINDOW_MS - (now - entry.windowStart) }
  }
  entry.count++
  return { allowed: true, remaining: MAX_REQ - entry.count, resetIn: WINDOW_MS - (now - entry.windowStart) }
}

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [ip, entry] of rateLimitMap.entries()) {
      if (now - entry.windowStart > WINDOW_MS * 2) rateLimitMap.delete(ip)
    }
  }, 5 * 60_000)
}

// ── Fallback local ────────────────────────────────────────────────────────────
function getLocalFallback(messages: { role: string; content: string }[]): string {
  const last = messages[messages.length - 1]?.content?.toLowerCase() || ''
  if (last.includes('motiv'))      return "La motivation ne dure pas, mais les habitudes si. Concentrez-vous sur votre prochain 1% et le reste suivra."
  if (last.includes('procrastin')) return "Pour vaincre la procrastination : démarrez avec 2 minutes sur la tâche la plus difficile. L'action crée l'élan, pas l'inverse."
  if (last.includes('streak'))     return "Chaque jour compte dans votre série. Une seule tâche complétée suffit à maintenir votre streak — ne cherchez pas la perfection."
  if (last.includes('objectif'))   return "Concentrez-vous sur un seul objectif majeur à la fois. La dispersion est l'ennemi numéro un de la progression."
  if (last.includes('priorit'))    return "Utilisez la règle du MIT : choisissez 3 tâches maximum pour aujourd'hui et finissez-les avant tout le reste."
  if (last.includes('fatigue'))    return "La fatigue est normale. Prévoyez des pauses actives de 5 minutes toutes les heures. Un cerveau reposé est deux fois plus efficace."
  const quotes = [
    "La discipline, c'est choisir entre ce que vous voulez maintenant et ce que vous voulez le plus.",
    "Chaque tâche complétée est une brique de plus dans la construction de votre meilleure version.",
    "Ce n'est pas la motivation qui crée l'action — c'est l'action qui crée la motivation.",
    "Petits progrès quotidiens = résultats extraordinaires à long terme.",
  ]
  return quotes[Math.floor(Math.random() * quotes.length)]
}

// ── Handler principal ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const { allowed, remaining, resetIn } = checkRateLimit(ip)

  const rlHeaders = {
    'X-RateLimit-Limit':     String(MAX_REQ),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset':     String(Math.ceil(resetIn / 1000)),
  }

  if (!allowed) {
    return NextResponse.json(
      { reply: `Tu envoies beaucoup de messages ! Réessaie dans ${Math.ceil(resetIn / 1000)} secondes. 🧘` },
      { status: 429, headers: rlHeaders }
    )
  }

  let messages: { role: string; content: string }[]
  let system: string | undefined

  try {
    const body = await req.json()
    messages = body.messages
    system   = body.system
    if (!Array.isArray(messages) || messages.length === 0)
      return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
    if (messages.length > 40) messages = messages.slice(-40)
    messages = messages.map((m) => ({ ...m, content: typeof m.content === 'string' ? m.content.slice(0, 2000) : '' }))
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    // Pas de clé → fallback non-streamé
    return NextResponse.json({ reply: getLocalFallback(messages) }, { status: 200, headers: rlHeaders })
  }

  const groqMessages = [
    ...(system ? [{ role: 'system', content: system }] : []),
    ...messages,
  ]

  try {
    const groqResp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:       'llama-3.3-70b-versatile',
        max_tokens:  500,
        temperature: 0.7,
        stream:      true,   // ← streaming activé
        messages:    groqMessages,
      }),
    })

    if (!groqResp.ok || !groqResp.body) {
      console.error('[coach] Groq error:', groqResp.status)
      return NextResponse.json({ reply: getLocalFallback(messages) }, { status: 200, headers: rlHeaders })
    }

    // On relaie le stream SSE de Groq directement au client
    const stream = new ReadableStream({
      async start(controller) {
        const reader  = groqResp.body!.getReader()
        const decoder = new TextDecoder()

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            // Chaque chunk peut contenir plusieurs lignes "data: {...}"
            for (const line of chunk.split('\n')) {
              const trimmed = line.trim()
              if (!trimmed.startsWith('data:')) continue
              const data = trimmed.slice(5).trim()
              if (data === '[DONE]') continue
              try {
                const parsed  = JSON.parse(data)
                const content = parsed.choices?.[0]?.delta?.content
                if (content) {
                  // On envoie chaque token sous forme "data: <token>\n\n"
                  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ token: content })}\n\n`))
                }
              } catch { /* chunk malformé — on ignore */ }
            }
          }
        } finally {
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
          controller.close()
          reader.releaseLock()
        }
      },
    })

    return new Response(stream, {
      headers: {
        ...rlHeaders,
        'Content-Type':  'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection':    'keep-alive',
      },
    })

  } catch (err) {
    console.error('[coach] fetch error:', err)
    return NextResponse.json({ reply: getLocalFallback(messages) }, { status: 200, headers: rlHeaders })
  }
}
