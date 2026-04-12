'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { BookOpenText, CalendarClock, Loader2, Sparkles } from 'lucide-react'
import BackButton from '@/components/BackButton'
import LocationInput from '@/components/LocationInput'
import Starfield from '@/components/Starfield'
import { useTranslation } from '@/lib/useTranslation'

type Profile = {
  id: string
  email: string
  display_name?: string | null
  birth_date?: string | null
  birth_time?: string | null
  birth_place?: string | null
  latitude?: number | null
  longitude?: number | null
  timezone?: string | null
}

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

/** Parse les réponses « Rôle : texte » (une ou plusieurs lignes par bulle). */
function parseJournalChat(reply: string): { speaker: string; body: string }[] {
  const trimmed = reply.trim()
  if (!trimmed) return []

  const speakerPattern =
    /^([A-Za-zÀ-ÿ][A-Za-zÀ-ÿéèêëàâôûùç'’\s]{1,30})\s*:\s*(.*)$/
  const messages: { speaker: string; body: string }[] = []
  let current: { speaker: string; lines: string[] } | null = null

  for (const line of trimmed.split('\n')) {
    const m = line.match(speakerPattern)
    if (m) {
      if (current) {
        messages.push({ speaker: current.speaker, body: current.lines.join('\n').trim() })
      }
      current = { speaker: m[1].trim(), lines: m[2] ? [m[2]] : [] }
    } else if (current) {
      current.lines.push(line)
    }
  }
  if (current) {
    messages.push({ speaker: current.speaker, body: current.lines.join('\n').trim() })
  }

  if (messages.length === 0) {
    return [{ speaker: 'Guilde', body: trimmed }]
  }
  return messages.filter((msg) => msg.body.length > 0)
}

export default function JournalPilotClient() {
  const t = useTranslation()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [sendingEntry, setSendingEntry] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [entryInput, setEntryInput] = useState('')
  const [nextExactLoading, setNextExactLoading] = useState(false)
  const [nextExactLines, setNextExactLines] = useState<string[] | null>(null)
  const [nextExactError, setNextExactError] = useState<string | null>(null)
  /** Permet de rouvrir le formulaire sans avoir à tout ressaisir à chaque visite (données déjà sur le compte). */
  const [editingNatal, setEditingNatal] = useState(false)

  const [profileForm, setProfileForm] = useState({
    display_name: '',
    birth_date: '',
    birth_time: '12:00',
    birth_place: '',
    latitude: 0,
    longitude: 0,
    timezone: 'UTC',
  })

  const profileComplete = useMemo(() => {
    return Boolean(
      profile?.birth_date &&
      profile?.birth_time &&
      profile?.birth_place &&
      typeof profile?.latitude === 'number' &&
      typeof profile?.longitude === 'number'
    )
  }, [profile])

  async function fetchProfileAndChat() {
    setLoading(true)
    setError(null)
    try {
      const profileRes = await fetch('/api/journal/profile')
      if (profileRes.status === 401) {
        router.push('/auth/signin?callbackUrl=/journal-pilot')
        return
      }
      const profileJson = await profileRes.json()
      if (!profileRes.ok) throw new Error(profileJson?.error || 'Erreur profil')

      const p: Profile | null = profileJson.profile
      setProfile(p)
      if (p) {
        setProfileForm({
          display_name: p.display_name || '',
          birth_date: p.birth_date || '',
          birth_time: p.birth_time || '12:00',
          birth_place: p.birth_place || '',
          latitude: p.latitude || 0,
          longitude: p.longitude || 0,
          timezone: p.timezone || 'UTC',
        })
      }

      const chatRes = await fetch('/api/journal/chat')
      const chatJson = await chatRes.json()
      if (!chatRes.ok) throw new Error(chatJson?.error || 'Erreur clavardage')
      setMessages(chatJson.messages || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfileAndChat()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSavingProfile(true)
    setError(null)
    try {
      const res = await fetch('/api/journal/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Impossible de sauvegarder le profil')
      setProfile(json.profile)
      setEditingNatal(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setSavingProfile(false)
    }
  }

  async function runNextExactTimes() {
    setNextExactLoading(true)
    setNextExactError(null)
    try {
      const res = await fetch('/api/journal/next-exact-times', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.error || 'Calcul impossible')
      }
      const lines: string[] = Array.isArray(json.linesFr) ? json.linesFr : []
      setNextExactLines(lines)
    } catch (err) {
      setNextExactError(err instanceof Error ? err.message : 'Erreur')
      setNextExactLines(null)
    } finally {
      setNextExactLoading(false)
    }
  }

  async function submitEntry(e: React.FormEvent) {
    e.preventDefault()
    if (!entryInput.trim()) return
    setSendingEntry(true)
    setError(null)
    try {
      const res = await fetch('/api/journal/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: entryInput.trim() }),
      })
      const json = await res.json()
      if (!res.ok) {
        if (json?.code === 'PROFILE_INCOMPLETE') {
          throw new Error("Enregistre d'abord tes données de naissance (ci-dessus) pour activer le clavardage.")
        }
        throw new Error(json?.error || 'Erreur de génération')
      }
      setEntryInput('')
      const added: ChatMessage[] = json.messages || []
      if (added.length > 0) {
        setMessages((prev) => [...prev, ...added])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setSendingEntry(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cosmic-purple to-magenta-purple flex items-center justify-center text-cosmic-gold">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-purple to-magenta-purple text-cosmic-gold relative">
      <Starfield />
      <div className="max-w-5xl mx-auto px-4 py-8 relative z-10">
        <BackButton />
        <div className="bg-cosmic-purple/40 backdrop-blur-md border border-cosmic-gold/30 rounded-xl p-6 mt-4">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <BookOpenText className="h-8 w-8" />
            Journal pilote Astrologie & Guilde
          </h1>
          <p className="text-cosmic-gold/85">
            Ici tu ouvres une session de <strong className="text-cosmic-gold">clavardage</strong> : tu poses des questions,
            tu lances des sujets, la guilde répond en s&apos;appuyant sur les <strong className="text-cosmic-gold">transits</strong> et le
            contexte astrologique — pas sur un écran de « calcul de thème ». Le fil est <strong className="text-cosmic-gold">mémorisé</strong> pour
            la continuité, les liens entre tes messages et les motifs qui reviennent. Divertissement symbolique — pas de
            fatalisme ni d&apos;angle médical.
          </p>
        </div>

        {error ? (
          <div className="mt-4 p-3 rounded-lg border border-red-400/40 bg-red-900/20 text-red-100">{error}</div>
        ) : null}

        {!profileComplete || editingNatal ? (
          <form onSubmit={saveProfile} className="mt-6 bg-cosmic-purple/40 backdrop-blur-md border border-cosmic-gold/30 rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-semibold">
              {!profileComplete ? 'Tes données de naissance (une seule fois)' : 'Modifier tes données de naissance'}
            </h2>
            <p className="text-sm text-cosmic-gold/75 -mt-2">
              {!profileComplete ? (
                <>
                  Elles sont <strong className="text-cosmic-gold">enregistrées sur ton compte</strong> : tu ne les saisis
                  qu’ici une fois, puis le journal les réutilise automatiquement à chaque connexion (transits, contexte
                  astro). On ne calcule pas ta carte sur cet écran : ces infos servent à enrichir le clavardage.
                </>
              ) : (
                <>
                  Les changements remplacent les données déjà liées à ton compte ; le clavardage utilisera la nouvelle
                  base dès l’enregistrement.
                </>
              )}
            </p>
            <div>
              <label className="block mb-1 text-sm">{t.dialogues.firstName}</label>
              <input
                value={profileForm.display_name}
                onChange={(e) => setProfileForm((p) => ({ ...p, display_name: e.target.value }))}
                className="w-full bg-white/10 border border-cosmic-gold/30 rounded-lg px-3 py-2 text-cosmic-gold"
                placeholder={t.dialogues.firstNamePlaceholder}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-sm">{t.dialogues.birthDate}</label>
                <input
                  type="date"
                  value={profileForm.birth_date}
                  onChange={(e) => setProfileForm((p) => ({ ...p, birth_date: e.target.value }))}
                  className="w-full bg-white/10 border border-cosmic-gold/30 rounded-lg px-3 py-2 text-cosmic-gold"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-sm">{t.dialogues.birthTime}</label>
                <input
                  type="time"
                  value={profileForm.birth_time}
                  onChange={(e) => setProfileForm((p) => ({ ...p, birth_time: e.target.value }))}
                  className="w-full bg-white/10 border border-cosmic-gold/30 rounded-lg px-3 py-2 text-cosmic-gold"
                  required
                />
              </div>
            </div>
            <LocationInput
              value={profileForm.birth_place}
              onChange={(value) => setProfileForm((p) => ({ ...p, birth_place: value }))}
              onLocationSelect={(location) =>
                setProfileForm((p) => ({
                  ...p,
                  birth_place: location.name,
                  latitude: location.latitude,
                  longitude: location.longitude,
                  timezone: location.timezone || 'UTC',
                }))
              }
              label={t.dialogues.birthPlace}
              variant="gold"
              required
            />
            <div className="flex flex-wrap gap-3">
              {editingNatal ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditingNatal(false)
                    if (profile) {
                      setProfileForm({
                        display_name: profile.display_name || '',
                        birth_date: profile.birth_date || '',
                        birth_time: profile.birth_time || '12:00',
                        birth_place: profile.birth_place || '',
                        latitude: profile.latitude || 0,
                        longitude: profile.longitude || 0,
                        timezone: profile.timezone || 'UTC',
                      })
                    }
                  }}
                  className="px-5 py-2 rounded-lg border border-cosmic-gold/50 text-cosmic-gold font-medium hover:bg-cosmic-gold/10 transition"
                >
                  Annuler
                </button>
              ) : null}
              <button
                type="submit"
                disabled={savingProfile}
                className="px-5 py-2 rounded-lg bg-cosmic-gold text-cosmic-purple font-semibold hover:bg-cosmic-gold/90 transition disabled:opacity-60"
              >
                {savingProfile
                  ? 'Sauvegarde...'
                  : profileComplete
                    ? 'Enregistrer les modifications'
                    : 'Enregistrer sur mon compte et ouvrir le clavardage'}
              </button>
            </div>
          </form>
        ) : null}

        {profileComplete && !editingNatal ? (
          <>
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-cosmic-gold/25 bg-cosmic-purple/30 px-4 py-3">
              <p className="text-sm text-cosmic-gold/85">
                <span className="font-medium text-cosmic-gold">Données de naissance</span> enregistrées sur ton compte
                {profile?.birth_place ? ` (${profile.birth_place})` : ''}
                {profile?.birth_date ? ` · ${profile.birth_date}` : ''}
                . Tu n’as rien à ressaisir à chaque visite.
              </p>
              <button
                type="button"
                onClick={() => setEditingNatal(true)}
                className="shrink-0 text-sm px-4 py-2 rounded-lg border border-cosmic-gold/45 text-cosmic-gold hover:bg-cosmic-gold/10 transition"
              >
                Modifier
              </button>
            </div>

            <form onSubmit={submitEntry} className="mt-6 bg-cosmic-purple/40 backdrop-blur-md border border-cosmic-gold/30 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Nouveau message
              </h2>
              <textarea
                value={entryInput}
                onChange={(e) => setEntryInput(e.target.value)}
                className="w-full min-h-[130px] bg-white/10 border border-cosmic-gold/30 rounded-lg px-3 py-2 text-cosmic-gold placeholder-cosmic-gold/55"
                placeholder="Pose une question ou poursuis la conversation — le contexte astro du jour est injecté à chaque réponse."
                maxLength={4000}
              />
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-cosmic-gold/70">{entryInput.length}/4000</span>
                <button
                  type="submit"
                  disabled={sendingEntry || !entryInput.trim()}
                  className="px-5 py-2 rounded-lg bg-cosmic-gold text-cosmic-purple font-semibold hover:bg-cosmic-gold/90 transition disabled:opacity-60"
                >
                  {sendingEntry ? 'En train de répondre...' : 'Envoyer'}
                </button>
              </div>
            </form>

            <div className="mt-4 bg-cosmic-purple/30 border border-cosmic-gold/25 rounded-xl p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-cosmic-gold flex items-center gap-2">
                    <CalendarClock className="h-4 w-4" />
                    Dates des prochains passages (calcul à part)
                  </h3>
                  <p className="text-xs text-cosmic-gold/70 mt-1">
                    Recherche numérique sur l’éphemeride (plus lourd) — lance-la quand tu veux des dates chiffrées. Tu peux
                    copier le résultat dans le clavardage pour que la guilde s’y réfère.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={runNextExactTimes}
                  disabled={nextExactLoading}
                  className="shrink-0 px-4 py-2 rounded-lg border border-cosmic-gold/50 text-cosmic-gold text-sm font-medium hover:bg-cosmic-gold/10 transition disabled:opacity-50"
                >
                  {nextExactLoading ? 'Calcul en cours…' : 'Lancer le calcul'}
                </button>
              </div>
              {nextExactError ? (
                <p className="mt-3 text-sm text-red-300">{nextExactError}</p>
              ) : null}
              {nextExactLines && nextExactLines.length > 0 ? (
                <pre className="mt-3 text-xs text-cosmic-gold/90 whitespace-pre-wrap font-sans bg-black/20 rounded-lg p-3 border border-cosmic-gold/15 max-h-48 overflow-y-auto">
                  {nextExactLines.join('\n')}
                </pre>
              ) : null}
              {nextExactLines && nextExactLines.length === 0 && !nextExactLoading ? (
                <p className="mt-3 text-sm text-cosmic-gold/70">Aucun passage trouvé dans l’horizon pour les aspects retenus.</p>
              ) : null}
            </div>

            <div className="mt-6 space-y-3">
              <h2 className="text-xl font-semibold">Fil de discussion</h2>
              <div className="p-4 rounded-xl border border-cosmic-gold/25 bg-cosmic-purple/35 backdrop-blur-sm min-h-[200px] max-h-[min(60vh,520px)] overflow-y-auto flex flex-col gap-3">
                {messages.length === 0 ? (
                  <div className="text-cosmic-gold/75 text-sm py-6 text-center">
                    Aucun message pour l&apos;instant. Écris pour ouvrir la conversation.
                  </div>
                ) : (
                  messages.map((m) =>
                    m.role === 'user' ? (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="self-end max-w-[90%] md:max-w-[75%]"
                      >
                        <div className="text-[10px] uppercase tracking-wide text-cosmic-gold/55 text-right mb-1">
                          Toi · {new Date(m.created_at).toLocaleString('fr-CA')}
                        </div>
                        <div className="rounded-2xl rounded-br-md px-4 py-2.5 bg-cosmic-gold/20 border border-cosmic-gold/35 text-cosmic-gold text-sm whitespace-pre-wrap">
                          {m.content}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="self-start w-full max-w-[95%] flex flex-col gap-2"
                      >
                        <div className="text-[10px] text-cosmic-gold/55">
                          Guilde · {new Date(m.created_at).toLocaleString('fr-CA')}
                        </div>
                        {parseJournalChat(m.content).map((bubble, idx) => (
                          <div key={`${m.id}-${idx}`} className="self-start max-w-[90%] md:max-w-[85%]">
                            <div className="text-[10px] uppercase tracking-wide text-cosmic-gold/55 mb-1">
                              {bubble.speaker}
                            </div>
                            <div className="rounded-2xl rounded-bl-md px-4 py-2.5 bg-white/5 border border-cosmic-gold/20 text-cosmic-gold/95 text-sm whitespace-pre-wrap">
                              {bubble.body}
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )
                  )
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
