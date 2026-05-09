import { NextRequest, NextResponse } from 'next/server'

// ── Rate limiting in-process (fenêtre glissante) ─────────────────────────────
// 20 requêtes par IP sur une fenêtre de 60 secondes
const WINDOW_MS  = 60_000   // 1 minute
const MAX_REQ    = 20       // requêtes max par fenêtre

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
    // Nouvelle fenêtre
    rateLimitMap.set(ip, { count: 1, windowStart: now })
    return { allowed: true, remaining: MAX_REQ - 1, resetIn: WINDOW_MS }
  }

  if (entry.count >= MAX_REQ) {
    const resetIn = WINDOW_MS - (now - entry.windowStart)
    return { allowed: false, remaining: 0, resetIn }
  }

  entry.count++
  return { allowed: true, remaining: MAX_REQ - entry.count, resetIn: WINDOW_MS - (now - entry.windowStart) }
}

// Nettoyage périodique pour éviter les fuites mémoire (toutes les 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [ip, entry] of rateLimitMap.entries()) {
      if (now - entry.windowStart > WINDOW_MS * 2) rateLimitMap.delete(ip)
    }
  }, 5 * 60_000)
}

// ── Handler principal ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const { allowed, remaining, resetIn } = checkRateLimit(ip)

  // Headers de rate limit (standard)
  const rlHeaders = {
    'X-RateLimit-Limit':     String(MAX_REQ),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset':     String(Math.ceil(resetIn / 1000)),
  }

  if (!allowed) {
    return NextResponse.json(
      {
        error: 'too_many_requests',
        message: `Trop de messages — réessaie dans ${Math.ceil(resetIn / 1000)} secondes.`,
        reply:   `Tu envoies beaucoup de messages ! Prends une pause de ${Math.ceil(resetIn / 1000)} secondes puis réessaie. 🧘`,
      },
      { status: 429, headers: rlHeaders }
    )
  }

  // Validation basique du body
  let messages: { role: string; content: string }[]
  let system: string | undefined

  try {
    const body = await req.json()
    messages = body.messages
    system   = body.system

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'invalid_body' }, { status: 400, headers: rlHeaders })
    }
    // Limite la taille des messages pour éviter les abus
    if (messages.length > 40) {
      messages = messages.slice(-40)
    }
    // Tronque les messages trop longs
    messages = messages.map((m) => ({
      ...m,
      content: typeof m.content === 'string' ? m.content.slice(0, 2000) : '',
    }))
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400, headers: rlHeaders })
  }

  // Fallback si pas de clé Groq
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { reply: getLocalFallback(messages) },
      { status: 200, headers: rlHeaders }
    )
  }

  // Groq utilise le format OpenAI : system message en tête
  const groqMessages = [
    ...(system ? [{ role: 'system', content: system }] : []),
    ...messages,
  ]

  try {
    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:       'llama-3.3-70b-versatile',
        max_tokens:  400,
        temperature: 0.7,
        messages:    groqMessages,
      }),
    })

    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}))
      console.error('[coach] Groq error:', resp.status, errData)
      return NextResponse.json(
        { reply: getLocalFallback(messages) },
        { status: 200, headers: rlHeaders }
      )
    }

    const data  = await resp.json()
    const reply = data.choices?.[0]?.message?.content || 'Je suis là pour vous aider à progresser !'
    return NextResponse.json({ reply }, { headers: rlHeaders })

  } catch (err) {
    console.error('[coach] Groq fetch error:', err)
    return NextResponse.json(
      { reply: getLocalFallback(messages) },
      { status: 200, headers: rlHeaders }
    )
  }
}

// ── Fallback local intelligent ────────────────────────────────────────────────
function getLocalFallback(messages: { role: string; content: string }[]): string {
  const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() || ''

  if (lastMsg.includes('motiv'))
    return "La motivation ne dure pas, mais les habitudes si. Concentrez-vous sur votre prochain 1% et le reste suivra."
  if (lastMsg.includes('procrastin'))
    return "Pour vaincre la procrastination : démarrez avec 2 minutes sur la tâche la plus difficile. L'action crée l'élan, pas l'inverse."
  if (lastMsg.includes('streak') || lastMsg.includes('série'))
    return "Chaque jour compte dans votre série. Une seule tâche complétée suffit à maintenir votre streak — ne cherchez pas la perfection."
  if (lastMsg.includes('objectif') || lastMsg.includes('goal'))
    return "Concentrez-vous sur un seul objectif majeur à la fois. La dispersion est l'ennemi numéro un de la progression."
  if (lastMsg.includes('priorit'))
    return "Utilisez la règle du MIT : choisissez 3 tâches maximum pour aujourd'hui et finissez-les avant tout le reste."
  if (lastMsg.includes('fatigue') || lastMsg.includes('épuis'))
    return "La fatigue est normale. Prévoyez des pauses actives de 5 minutes toutes les heures. Un cerveau reposé est deux fois plus efficace."

  const quotes = [
    "La discipline, c'est choisir entre ce que vous voulez maintenant et ce que vous voulez le plus.",
    "Chaque tâche complétée est une brique de plus dans la construction de votre meilleure version.",
    "Ce n'est pas la motivation qui crée l'action — c'est l'action qui crée la motivation.",
    "Petits progrès quotidiens = résultats extraordinaires à long terme.",
  ]
  return quotes[Math.floor(Math.random() * quotes.length)]
}
