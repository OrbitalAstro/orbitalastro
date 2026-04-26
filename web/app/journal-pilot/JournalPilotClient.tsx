'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Archive, BookOpenText, Brain, CalendarClock, Loader2, Sparkles, Trash2 } from 'lucide-react'
import BackButton from '@/components/BackButton'
import Starfield from '@/components/Starfield'
import { JOURNAL_MEMORY_LIGHT_EVERY_N } from '@/lib/journal-memory-constants'

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

type ArchivedThread = {
  id: string
  created_at: string
  updated_at: string
  archived_at?: string | null
  source?: 'server' | 'local'
  messages?: ChatMessage[]
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

  const normalized = messages.length === 0 ? [{ speaker: 'Guilde', body: trimmed }] : messages.filter((msg) => msg.body.length > 0)
  // Réduit le bruit visuel : fusionne les blocs consécutifs d'un même intervenant.
  return normalized.reduce<{ speaker: string; body: string }[]>((acc, current) => {
    const prev = acc[acc.length - 1]
    if (prev && prev.speaker === current.speaker) {
      prev.body = `${prev.body}\n\n${current.body}`.trim()
      return acc
    }
    acc.push({ ...current })
    return acc
  }, [])
}

const JOURNAL_SIGNIN = '/auth/signin?callbackUrl=/journal-pilot'
const JOURNAL_ONBOARDING = '/auth/onboarding?next=%2Fjournal-pilot'
const LOCAL_ARCHIVE_KEY = 'journal_pilot_local_archives_v1'

export default function JournalPilotClient() {
  const [authGate, setAuthGate] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')

  const [loading, setLoading] = useState(true)
  const [sendingEntry, setSendingEntry] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [archivedThreads, setArchivedThreads] = useState<ArchivedThread[]>([])
  const [selectedArchive, setSelectedArchive] = useState<{ id: string; messages: ChatMessage[] } | null>(null)
  const [entryInput, setEntryInput] = useState('')
  const [endingConversation, setEndingConversation] = useState(false)
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)
  const [loadingArchiveId, setLoadingArchiveId] = useState<string | null>(null)
  const [nextExactLoading, setNextExactLoading] = useState(false)
  const [nextExactLines, setNextExactLines] = useState<string[] | null>(null)
  const [nextExactError, setNextExactError] = useState<string | null>(null)
  const threadRef = useRef<HTMLDivElement | null>(null)

  const [memoryDraft, setMemoryDraft] = useState('')
  const [memoryUpdatedAt, setMemoryUpdatedAt] = useState<string | null>(null)
  const [memoryLoading, setMemoryLoading] = useState(false)
  const [memorySaving, setMemorySaving] = useState(false)
  const [showMemoryClearConfirm, setShowMemoryClearConfirm] = useState(false)

  function readLocalArchives(): ArchivedThread[] {
    if (typeof window === 'undefined') return []
    try {
      const raw = window.localStorage.getItem(LOCAL_ARCHIVE_KEY)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return []
      return parsed
        .filter((item) => item && typeof item.id === 'string')
        .map((item) => ({
          id: item.id,
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString(),
          archived_at: item.archived_at || null,
          source: 'local' as const,
          messages: Array.isArray(item.messages) ? item.messages : [],
        }))
    } catch {
      return []
    }
  }

  function writeLocalArchives(archives: ArchivedThread[]) {
    if (typeof window === 'undefined') return
    const payload = archives
      .filter((a) => a.source === 'local')
      .map((a) => ({
        id: a.id,
        created_at: a.created_at,
        updated_at: a.updated_at,
        archived_at: a.archived_at || null,
        messages: a.messages || [],
      }))
    window.localStorage.setItem(LOCAL_ARCHIVE_KEY, JSON.stringify(payload))
  }

  const profileComplete = useMemo(() => {
    return Boolean(
      profile?.birth_date &&
      profile?.birth_time &&
      profile?.birth_place &&
      typeof profile?.latitude === 'number' &&
      typeof profile?.longitude === 'number'
    )
  }, [profile])

  const fetchJournalMemory = useCallback(async () => {
    setMemoryLoading(true)
    try {
      const memRes = await fetch('/api/journal/memory', { credentials: 'include' })
      const memJson = await memRes.json()
      if (memRes.ok) {
        setMemoryDraft(String(memJson.summary || ''))
        setMemoryUpdatedAt(memJson.updated_at ? String(memJson.updated_at) : null)
      } else {
        setMemoryDraft('')
        setMemoryUpdatedAt(null)
      }
    } catch {
      setMemoryDraft('')
      setMemoryUpdatedAt(null)
    } finally {
      setMemoryLoading(false)
    }
  }, [])

  async function saveJournalMemory() {
    setMemorySaving(true)
    setError(null)
    try {
      const res = await fetch('/api/journal/memory', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary: memoryDraft }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'Sauvegarde mémoire impossible')
      setMemoryUpdatedAt(j.updated_at ? String(j.updated_at) : null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur mémoire')
    } finally {
      setMemorySaving(false)
    }
  }

  async function clearJournalMemory() {
    setMemorySaving(true)
    setError(null)
    try {
      const res = await fetch('/api/journal/memory', { method: 'DELETE', credentials: 'include' })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'Effacement impossible')
      setMemoryDraft('')
      setMemoryUpdatedAt(j.updated_at ? String(j.updated_at) : null)
      setShowMemoryClearConfirm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur mémoire')
    } finally {
      setMemorySaving(false)
    }
  }

  async function fetchProfileAndChat() {
    setLoading(true)
    setError(null)
    try {
      const profileRes = await fetch('/api/journal/profile', { credentials: 'include' })
      if (profileRes.status === 401) {
        window.location.assign(JOURNAL_SIGNIN)
        return
      }
      const profileJson = await profileRes.json()
      if (!profileRes.ok) throw new Error(profileJson?.error || 'Erreur profil')

      const p: Profile | null = profileJson.profile
      setProfile(p)
      const hasCompleteProfile = Boolean(
        p?.birth_date &&
          p?.birth_time &&
          p?.birth_place &&
          typeof p?.latitude === 'number' &&
          typeof p?.longitude === 'number',
      )
      if (!hasCompleteProfile) {
        window.location.assign(JOURNAL_ONBOARDING)
        return
      }

      const chatRes = await fetch('/api/journal/chat', { credentials: 'include' })
      const chatJson = await chatRes.json()
      if (!chatRes.ok) throw new Error(chatJson?.error || 'Erreur clavardage')
      setMessages(chatJson.messages || [])
      const serverArchives: ArchivedThread[] = (chatJson.archivedThreads || []).map((t: ArchivedThread) => ({
        ...t,
        source: 'server',
      }))
      const localArchives = readLocalArchives()
      setArchivedThreads([...serverArchives, ...localArchives])
      await fetchJournalMemory()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    getSession().then((session) => {
      if (cancelled) return
      if (!session?.user) {
        setAuthGate('unauthenticated')
        window.location.assign(JOURNAL_SIGNIN)
        return
      }
      setAuthGate('authenticated')
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (authGate !== 'authenticated') return
    fetchProfileAndChat()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authGate])

  useEffect(() => {
    if (!threadRef.current) return
    threadRef.current.scrollTop = threadRef.current.scrollHeight
  }, [messages, sendingEntry])

  async function submitEntry(e: React.FormEvent) {
    e.preventDefault()
    if (!entryInput.trim()) return
    setSendingEntry(true)
    setError(null)
    try {
      const res = await fetch('/api/journal/chat', {
        method: 'POST',
        credentials: 'include',
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
      void fetchJournalMemory()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setSendingEntry(false)
    }
  }

  async function endConversation() {
    setEndingConversation(true)
    setError(null)
    try {
      const res = await fetch('/api/journal/chat/archive', {
        method: 'POST',
        credentials: 'include',
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "Impossible d'archiver la conversation.")
      if (json?.localArchiveOnly && json?.archivedSnapshot) {
        const localSnapshot: ArchivedThread = {
          ...json.archivedSnapshot,
          source: 'local',
          messages: Array.isArray(json.archivedSnapshot.messages) ? json.archivedSnapshot.messages : [],
        }
        const localArchives = [localSnapshot, ...readLocalArchives()]
        writeLocalArchives(localArchives)
      }
      setEntryInput('')
      setMessages([])
      setSelectedArchive(null)
      await fetchProfileAndChat()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setEndingConversation(false)
    }
  }

  async function openArchivedConversation(threadId: string) {
    setLoadingArchiveId(threadId)
    setError(null)
    try {
      const localArchive = archivedThreads.find((t) => t.id === threadId && t.source === 'local')
      if (localArchive) {
        setSelectedArchive({ id: threadId, messages: localArchive.messages || [] })
        return
      }

      const res = await fetch(`/api/journal/chat/thread/${threadId}`, { credentials: 'include' })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Impossible de charger cet historique.')
      setSelectedArchive({ id: threadId, messages: json.messages || [] })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoadingArchiveId(null)
    }
  }

  if (authGate === 'loading' || authGate === 'unauthenticated' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cosmic-purple to-magenta-purple flex items-center justify-center text-cosmic-gold">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-purple to-magenta-purple text-cosmic-gold relative">
      <Starfield />
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-5 sm:py-8 relative z-10">
        <BackButton />
        <div className="bg-cosmic-purple/40 backdrop-blur-md border border-cosmic-gold/30 rounded-xl p-4 sm:p-6 mt-4">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-2">
            <BookOpenText className="h-8 w-8" />
            Journal pilote Astrologie & Guilde
          </h1>
          <p className="text-cosmic-gold/85 text-sm sm:text-base">
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

        {profileComplete ? (
          <>
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-cosmic-gold/25 bg-cosmic-purple/30 px-3 sm:px-4 py-3">
              <p className="text-sm text-cosmic-gold/85">
                <span className="font-medium text-cosmic-gold">Données de naissance</span> enregistrées sur ton compte
                {profile?.birth_place ? ` (${profile.birth_place})` : ''}
                {profile?.birth_date ? ` · ${profile.birth_date}` : ''}
                . Tu n’as rien à ressaisir à chaque visite.
              </p>
            </div>

            <div className="mt-4 bg-cosmic-purple/30 border border-cosmic-gold/25 rounded-xl p-3 sm:p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-cosmic-gold flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Mémoire du journal (compte)
                  </h3>
                  <p className="text-xs text-cosmic-gold/70 mt-1 max-w-prose">
                    Résumé persistant pour la cohérence d&apos;une session à l&apos;autre. Tu peux le relire, le corriger
                    ou l&apos;effacer. Il est aussi mis à jour automatiquement (tous les {JOURNAL_MEMORY_LIGHT_EVERY_N}{' '}
                    messages de la guilde environ,
                    et à chaque archivage).
                  </p>
                  {memoryUpdatedAt ? (
                    <p className="text-[10px] text-cosmic-gold/55 mt-1">
                      Dernière mise à jour : {new Date(memoryUpdatedAt).toLocaleString('fr-CA')}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => fetchJournalMemory()}
                    disabled={memoryLoading}
                    className="w-full sm:w-auto px-3 py-2 rounded-lg border border-cosmic-gold/40 text-cosmic-gold text-xs font-medium hover:bg-cosmic-gold/10 transition disabled:opacity-50"
                  >
                    {memoryLoading ? 'Chargement…' : 'Rafraîchir'}
                  </button>
                </div>
              </div>
              {memoryLoading ? (
                <div className="mt-3 flex items-center gap-2 text-sm text-cosmic-gold/80">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Chargement de la mémoire…
                </div>
              ) : (
                <>
                  <textarea
                    value={memoryDraft}
                    onChange={(e) => setMemoryDraft(e.target.value)}
                    className="mt-3 w-full min-h-[140px] bg-black/25 border border-cosmic-gold/25 rounded-lg px-3 py-2 text-sm text-cosmic-gold placeholder-cosmic-gold/45"
                    placeholder="(vide) — la mémoire se remplit au fil des échanges ou tu peux écrire ici ce que la guilde doit savoir sur toi."
                    maxLength={3600}
                  />
                  <div className="mt-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setShowMemoryClearConfirm(true)}
                      disabled={memorySaving || !memoryDraft.trim()}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-red-400/50 text-red-200 text-xs font-medium hover:bg-red-900/30 transition disabled:opacity-40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Effacer la mémoire
                    </button>
                    <button
                      type="button"
                      onClick={saveJournalMemory}
                      disabled={memorySaving}
                      className="w-full sm:w-auto px-4 py-2 rounded-lg bg-cosmic-gold text-cosmic-purple text-sm font-semibold hover:bg-cosmic-gold/90 transition disabled:opacity-60"
                    >
                      {memorySaving ? 'Enregistrement…' : 'Enregistrer'}
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 bg-cosmic-purple/30 border border-cosmic-gold/25 rounded-xl p-3 sm:p-4">
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
                  className="w-full sm:w-auto shrink-0 px-4 py-2 rounded-lg border border-cosmic-gold/50 text-cosmic-gold text-sm font-medium hover:bg-cosmic-gold/10 transition disabled:opacity-50"
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
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-semibold">Fil de discussion</h2>
              </div>
              <div
                ref={threadRef}
                className="p-3 sm:p-4 rounded-xl border border-cosmic-gold/30 bg-cosmic-purple/20 backdrop-blur-sm min-h-[180px] max-h-[min(56vh,520px)] sm:max-h-[min(60vh,520px)] overflow-y-auto flex flex-col gap-3"
              >
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
                        className="self-end max-w-[96%] sm:max-w-[90%] md:max-w-[75%]"
                      >
                        <div className="text-[10px] uppercase tracking-wide text-cosmic-gold/55 text-right mb-1">
                          Toi · {new Date(m.created_at).toLocaleString('fr-CA')}
                        </div>
                        <div className="rounded-2xl rounded-br-md px-4 py-2.5 bg-cosmic-gold/22 border border-cosmic-gold/45 text-cosmic-gold text-sm whitespace-pre-wrap">
                          {m.content}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="self-start w-full max-w-[98%] sm:max-w-[95%] flex flex-col gap-2"
                      >
                        <div className="text-[10px] text-cosmic-gold/55">
                          Guilde · {new Date(m.created_at).toLocaleString('fr-CA')}
                        </div>
                        {parseJournalChat(m.content).map((bubble, idx) => {
                          const isAstrology = bubble.speaker.trim().toLowerCase() === 'astrologie'
                          return (
                            <div
                              key={`${m.id}-${idx}`}
                              className={isAstrology ? 'self-center w-full max-w-[100%] sm:max-w-[96%] md:max-w-[90%]' : 'self-start max-w-[96%] sm:max-w-[90%] md:max-w-[85%]'}
                            >
                              <div className="text-[10px] uppercase tracking-wide text-cosmic-gold/55 mb-1">
                                {bubble.speaker}
                              </div>
                              <div
                                className={
                                  isAstrology
                                    ? 'rounded-2xl px-4 py-2.5 bg-white/20 border border-cosmic-gold/45 text-cosmic-gold text-sm whitespace-pre-wrap'
                                    : 'rounded-2xl rounded-bl-md px-4 py-2.5 bg-white/12 border border-cosmic-gold/35 text-cosmic-gold text-sm whitespace-pre-wrap'
                                }
                              >
                                {bubble.body}
                              </div>
                            </div>
                          )
                        })}
                      </motion.div>
                    )
                  )
                )}
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <h2 className="text-xl font-semibold">Historique</h2>
              <p className="text-xs text-cosmic-gold/70">
                L&apos;historique archivé est affiché ici, juste sous le fil de discussion.
              </p>
              <div className="p-3 sm:p-4 rounded-xl border border-cosmic-gold/30 bg-cosmic-purple/20 backdrop-blur-sm">
                {archivedThreads.length === 0 ? (
                  <p className="text-sm text-cosmic-gold/70">Aucune conversation archivée pour le moment.</p>
                ) : (
                  <div className="space-y-2">
                    {archivedThreads.map((thread) => {
                      const isLoading = loadingArchiveId === thread.id
                      return (
                        <button
                          key={thread.id}
                          type="button"
                          onClick={() => openArchivedConversation(thread.id)}
                          disabled={isLoading}
                          className="w-full text-left rounded-lg border border-cosmic-gold/30 hover:border-cosmic-gold/50 px-3 py-2 transition disabled:opacity-60"
                        >
                          <div className="text-sm text-cosmic-gold font-medium break-words">
                            Conversation archivée · {new Date(thread.archived_at || thread.updated_at).toLocaleString('fr-CA')}
                          </div>
                          <div className="text-xs text-cosmic-gold/70 mt-1">
                            Source: {thread.source === 'local' ? 'cet appareil' : 'compte'}
                            {' · '}
                            Début: {new Date(thread.created_at).toLocaleString('fr-CA')}
                            {isLoading ? ' · Chargement...' : ''}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
              {selectedArchive ? (
                <div className="p-3 sm:p-4 rounded-xl border border-cosmic-gold/25 bg-black/20 max-h-[52vh] sm:max-h-[420px] overflow-y-auto flex flex-col gap-2">
                  <p className="text-xs uppercase tracking-wide text-cosmic-gold/65">
                    Historique ouvert · {new Date(archivedThreads.find((t) => t.id === selectedArchive.id)?.archived_at || '').toLocaleString('fr-CA')}
                  </p>
                  {selectedArchive.messages.map((m) => (
                    <div key={m.id} className="rounded-lg border border-cosmic-gold/20 bg-cosmic-purple/25 px-3 py-2">
                      <div className="text-[10px] uppercase tracking-wide text-cosmic-gold/60 mb-1">
                        {m.role === 'user' ? 'Toi' : 'Guilde'} · {new Date(m.created_at).toLocaleString('fr-CA')}
                      </div>
                      <div className="text-sm text-cosmic-gold whitespace-pre-wrap">{m.content}</div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <form onSubmit={submitEntry} className="mt-4 bg-cosmic-purple/40 backdrop-blur-md border border-cosmic-gold/30 rounded-xl p-3 sm:p-4">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Répondre dans le fil
              </h2>
              <textarea
                value={entryInput}
                onChange={(e) => setEntryInput(e.target.value)}
                className="w-full min-h-[100px] bg-white/10 border border-cosmic-gold/30 rounded-lg px-3 py-2 text-cosmic-gold placeholder-cosmic-gold/55"
                placeholder="Écris ta réponse pour continuer la conversation..."
                maxLength={4000}
              />
              <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <span className="text-sm text-cosmic-gold/70">{entryInput.length}/4000</span>
                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowArchiveConfirm(true)}
                    disabled={endingConversation || messages.length === 0 || sendingEntry}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-cosmic-gold/45 text-cosmic-gold text-sm font-medium hover:bg-cosmic-gold/10 transition disabled:opacity-50"
                  >
                    <Archive className="h-4 w-4" />
                    {endingConversation ? 'Archivage...' : 'Fin de la conversation'}
                  </button>
                  <button
                    type="submit"
                    disabled={sendingEntry || !entryInput.trim()}
                    className="w-full sm:w-auto px-5 py-2 rounded-lg bg-cosmic-gold text-cosmic-purple font-semibold hover:bg-cosmic-gold/90 transition disabled:opacity-60"
                  >
                    {sendingEntry ? 'En train de répondre...' : 'Envoyer'}
                  </button>
                </div>
              </div>
            </form>
          </>
        ) : null}
      </div>
      {showArchiveConfirm ? (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/60 px-3 sm:px-4 pb-3 sm:pb-0">
          <div className="w-full max-w-md rounded-xl border border-cosmic-gold/30 bg-cosmic-purple/95 p-4 sm:p-5 shadow-2xl">
            <h3 className="text-lg font-semibold text-cosmic-gold">Terminer la conversation ?</h3>
            <p className="mt-2 text-sm text-cosmic-gold/80">
              Le fil actuel sera archivé dans l&apos;historique et une nouvelle conversation vide sera créée.
            </p>
            <div className="mt-5 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowArchiveConfirm(false)}
                disabled={endingConversation}
                className="w-full sm:w-auto px-4 py-2 rounded-lg border border-cosmic-gold/35 text-cosmic-gold/90 hover:bg-cosmic-gold/10 transition disabled:opacity-60"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={async () => {
                  await endConversation()
                  setShowArchiveConfirm(false)
                }}
                disabled={endingConversation}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-cosmic-gold text-cosmic-purple font-semibold hover:bg-cosmic-gold/90 transition disabled:opacity-60"
              >
                {endingConversation ? 'Archivage...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {showMemoryClearConfirm ? (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/60 px-3 sm:px-4 pb-3 sm:pb-0">
          <div className="w-full max-w-md rounded-xl border border-red-400/35 bg-cosmic-purple/95 p-4 sm:p-5 shadow-2xl">
            <h3 className="text-lg font-semibold text-cosmic-gold">Effacer la mémoire du journal ?</h3>
            <p className="mt-2 text-sm text-cosmic-gold/80">
              Le résumé persistant sur ton compte sera vidé. La guilde n&apos;aura plus ce contexte jusqu&apos;à ce qu&apos;il se
              reconstruise au fil des prochains échanges (ou que tu le réécrives toi-même).
            </p>
            <div className="mt-5 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowMemoryClearConfirm(false)}
                disabled={memorySaving}
                className="w-full sm:w-auto px-4 py-2 rounded-lg border border-cosmic-gold/35 text-cosmic-gold/90 hover:bg-cosmic-gold/10 transition disabled:opacity-60"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => void clearJournalMemory()}
                disabled={memorySaving}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-red-700 text-white font-semibold hover:bg-red-600 transition disabled:opacity-60"
              >
                {memorySaving ? 'Effacement…' : 'Effacer définitivement'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
