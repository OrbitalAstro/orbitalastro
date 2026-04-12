'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { BookOpenText, Loader2, Sparkles } from 'lucide-react'
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setSavingProfile(false)
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
          throw new Error("Complète d'abord ton profil natal avant d'écrire dans le journal.")
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
            Clavardage continu : la guilde se souvient du fil pour relier tes idées et repérer des motifs dans ce que tu
            partages. Chaque réponse s&apos;appuie aussi sur ton natal et les transits du moment. Divertissement
            symbolique — pas de fatalisme ni d&apos;angle médical.
          </p>
        </div>

        {error ? (
          <div className="mt-4 p-3 rounded-lg border border-red-400/40 bg-red-900/20 text-red-100">{error}</div>
        ) : null}

        {!profileComplete ? (
          <form onSubmit={saveProfile} className="mt-6 bg-cosmic-purple/40 backdrop-blur-md border border-cosmic-gold/30 rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-semibold">Complète ton profil natal</h2>
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
            <button
              type="submit"
              disabled={savingProfile}
              className="px-5 py-2 rounded-lg bg-cosmic-gold text-cosmic-purple font-semibold hover:bg-cosmic-gold/90 transition disabled:opacity-60"
            >
              {savingProfile ? 'Sauvegarde...' : 'Sauvegarder mon profil natal'}
            </button>
          </form>
        ) : (
          <>
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
        )}
      </div>
    </div>
  )
}
