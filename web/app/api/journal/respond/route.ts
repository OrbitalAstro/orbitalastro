import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { getSupabaseAdmin } from '@/lib/supabase'
import { fetchJournalAstroContext } from '@/lib/journal-astro-context'

export const runtime = 'nodejs'

function getApiBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '')
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { entry } = await request.json()
    const entryText = String(entry || '').trim()
    if (!entryText) {
      return NextResponse.json({ error: 'Entrée vide.' }, { status: 400 })
    }
    if (entryText.length > 4000) {
      return NextResponse.json({ error: 'Entrée trop longue (max 4000 caractères).' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { data: user, error: userError } = await supabase
      .from('auth_users')
      .select('id, email, display_name, birth_date, birth_time, birth_place, latitude, longitude, timezone')
      .eq('id', session.user.id)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: userError?.message || 'Profil utilisateur introuvable.' }, { status: 500 })
    }

    if (!user.birth_date || !user.birth_time || !user.birth_place || user.latitude == null || user.longitude == null) {
      return NextResponse.json(
        { error: 'Profil natal incomplet.', code: 'PROFILE_INCOMPLETE' },
        { status: 400 }
      )
    }

    let astro
    try {
      astro = await fetchJournalAstroContext({
        birth_date: user.birth_date,
        birth_time: user.birth_time,
        birth_place: user.birth_place,
        latitude: user.latitude,
        longitude: user.longitude,
        timezone: user.timezone,
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur astro'
      return NextResponse.json({ error: msg }, { status: 502 })
    }

    const { natalSummary, majorTransitSummary, majorTransits, targetDate } = astro

    const systemInstruction = `Tu incarnes l'astrologue et la guilde planétaire en mode CLAVARDAGE (messagerie instantanée), pas en mode consultation écrite.

Interdictions:
- Aucune "lecture" longue, aucun ton de rapport, d'interprétation formelle ou de dissertation ("ton thème révèle", "au vu de votre carte", analyse structurée type cours).
- Pas de listes à puces magistrales ni de résumé "en conclusion".

Obligations:
- Style messagerie : plusieurs petits messages qui se suivent, comme dans une discussion de groupe.
- Chaque message est court (1 à 4 phrases max), naturel, chaleureux, en français, tutoiement si ça sonne bien.
- Format STRICT : une ligne par message, toujours exactement « Rôle : texte » (espace après les deux-points). Rôles autorisés : Astrologie, Lune, Soleil, Mercure, Vénus, Mars, Jupiter, Saturne, Uranus, Neptune, Pluton — n'utilise que les planètes vraiment pertinentes (souvent 1 à 3), plus Astrologie.
- Ne pas inventer de positions, aspects ou transits absents des données fournies.
- Journal symbolique / divertissement : jamais médical, jamais fataliste. Métaphores clairement symboliques.`

    const prompt = `Contexte (pour t'ancrer, ne pas le recopier comme un rapport au client):
- Prénom ou nom: ${user.display_name || 'Client'}
- Date du journal: ${new Date().toLocaleDateString('fr-CA')}
- Résumé natal: ${natalSummary}
- Transits majeurs du moment:
- ${majorTransitSummary}

Message qu'elle/il vient d'envoyer dans le fil de discussion:
"""${entryText}"""

Réponds en 4 à 10 lignes au format « Rôle : … », uniquement comme dans un clavardage (pas d'introduction du type "voici mon interprétation").`

    const apiBase = getApiBaseUrl()
    const aiResponse = await fetch(`${apiBase}/ai/interpret`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        system_instruction: systemInstruction,
        temperature: 0.82,
      }),
    })

    if (!aiResponse.ok) {
      const errText = await aiResponse.text()
      return NextResponse.json({ error: `Erreur IA: ${errText}` }, { status: 502 })
    }

    const aiData = await aiResponse.json()
    const replyText = String(aiData?.content || '').trim()
    if (!replyText) {
      return NextResponse.json({ error: 'Réponse IA vide.' }, { status: 502 })
    }

    const { data: savedEntry, error: saveError } = await supabase
      .from('journal_entries')
      .insert({
        user_id: user.id,
        entry_text: entryText,
        reply_text: replyText,
        metadata: {
          natal_summary: natalSummary,
          transit_summary: majorTransits,
          target_date: targetDate,
        },
      })
      .select('id, entry_text, reply_text, metadata, created_at')
      .single()

    if (saveError) {
      return NextResponse.json({ error: saveError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, entry: savedEntry })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
