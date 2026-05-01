import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { messages, system } = await req.json()

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { reply: getLocalFallback(messages) },
      { status: 200 }
    )
  }

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        system,
        messages,
      }),
    })

    const data = await resp.json()
    const reply = data.content?.[0]?.text || 'Je suis là pour vous aider à progresser !'
    return NextResponse.json({ reply })
  } catch (err) {
    return NextResponse.json({ reply: getLocalFallback(messages) }, { status: 200 })
  }
}

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
