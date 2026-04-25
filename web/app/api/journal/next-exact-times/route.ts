import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getSupabaseAdmin } from '@/lib/supabase'
import { computeJournalNextExactTimes } from '@/lib/journal-astro-context'

export const runtime = 'nodejs'

/**
 * Calcul explicite : prochains passages à orbe minimale (indices élargis).
 * Résultats mis en cache Supabase (`journal_next_exact_cache`) pour thème + paramètres identiques.
 */
export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  const { data: user, error: userError } = await supabase
    .from('auth_users')
    .select('birth_date, birth_time, birth_place, latitude, longitude, timezone')
    .eq('id', session.user.id)
    .single()

  if (userError || !user) {
    return NextResponse.json({ error: userError?.message || 'Profil introuvable.' }, { status: 500 })
  }

  if (!user.birth_date || !user.birth_time || !user.birth_place || user.latitude == null || user.longitude == null) {
    return NextResponse.json({ error: 'Profil natal incomplet.', code: 'PROFILE_INCOMPLETE' }, { status: 400 })
  }

  try {
    const result = await computeJournalNextExactTimes(
      {
        birth_date: user.birth_date,
        birth_time: user.birth_time,
        birth_place: user.birth_place,
        latitude: user.latitude,
        longitude: user.longitude,
        timezone: user.timezone,
      },
      { hintLimit: 24 },
    )

    return NextResponse.json({
      ok: true,
      referenceIso: result.referenceIso,
      exacts: result.exacts,
      linesFr: result.linesFr,
      hintsUsed: result.hintsUsed,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur calcul'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
