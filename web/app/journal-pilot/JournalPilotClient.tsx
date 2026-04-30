'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import {
  Archive,
  BookOpenText,
  Brain,
  CalendarClock,
  History,
  Loader2,
  Trash2,
  X,
} from 'lucide-react'
import BackButton from '@/components/BackButton'
import Starfield from '@/components/Starfield'
import { parseJournalGuildReply } from '@/lib/journal-chat-parse'
import { JOURNAL_MEMORY_LIGHT_EVERY_N } from '@/lib/journal-memory-constants'
import { glyphForJournalSpeaker } from '@/lib/journal-speaker-symbols'

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
  archive_title?: string | null
  source?: 'server' | 'local'
  messages?: ChatMessage[]
}

const parseJournalChat = parseJournalGuildReply

function JournalSpeakerGlyph({ speaker }: { speaker: string }) {
  const g = glyphForJournalSpeaker(speaker)
  if (!g) return null
  return (
    <span className="mr-1 inline-block align-baseline text-[1.1rem] leading-none text-cosmic-gold/90" aria-hidden>
      {g}
    </span>
  )
}

const JOURNAL_SIGNIN = '/auth/signin?callbackUrl=/journal-pilot'
const JOURNAL_ONBOARDING = '/auth/onboarding?next=%2Fjournal-pilot'
const LOCAL_ARCHIVE_KEY = 'journal_pilot_local_archives_v1'

const JOURNAL_EMPTY_THREAD_WELCOME = `Bonjour — la guilde t’accueille ici.

Écris ce qui te préoccupe, ce que tu veux explorer, ou une simple intuition à creuser : dès que tu envoies ton message, la réponse s’ajoute dans la même conversation, juste au-dessus, comme un fil naturel — pas besoin de « remonter » vers une autre zone.`

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
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false)
  const [isNearBottom, setIsNearBottom] = useState(true)
  const entryTextareaRef = useRef<HTMLTextAreaElement | null>(null)

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
          archive_title: typeof item.archive_title === 'string' ? item.archive_title : null,
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
        archive_title: a.archive_title || null,
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

  const scrollThreadToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    if (!threadRef.current) return
    threadRef.current.scrollTo({ top: threadRef.current.scrollHeight, behavior })
  }, [])

  useEffect(() => {
    const el = threadRef.current
    if (!el) return
    const onScroll = () => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
      setIsNearBottom(distanceFromBottom < 140)
    }
    onScroll()
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (isNearBottom || sendingEntry) {
      scrollThreadToBottom('smooth')
    }
  }, [messages, sendingEntry, isNearBottom, scrollThreadToBottom])

  useEffect(() => {
    const el = entryTextareaRef.current
    if (!el) return
    const computed = window.getComputedStyle(el)
    const lineHeight = Number.parseFloat(computed.lineHeight) || 24
    const maxHeight = Math.round(lineHeight * 6)

    el.style.height = 'auto'
    const next = Math.min(el.scrollHeight, maxHeight)
    el.style.height = `${Math.max(next, Math.round(lineHeight * 2))}px`
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }, [entryInput])

  async function runNextExactTimes() {
    setNextExactLoading(true)
    setNextExactError(null)
    try {
      const res = await fetch('/api/journal/next-exact-times', {
        method: 'POST',
        credentials: 'include',
      })
      const json = await res.json()
      if (!res.ok) {
        if (json?.code === 'PROFILE_INCOMPLETE') {
          throw new Error("Enregistre d'abord tes données de naissance (ci-dessus) pour lancer ce calcul.")
        }
        throw new Error(json?.error || 'Erreur de calcul des prochains passages.')
      }
      setNextExactLines(Array.isArray(json?.linesFr) ? json.linesFr : [])
    } catch (err) {
      setNextExactLines(null)
      setNextExactError(err instanceof Error ? err.message : 'Erreur inconnue')
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
            {/* Fil descendant continu : pas de « boîte » autour du dialogue — la zone de saisie prolonge le fil */}
            <section className="mt-8 flex min-h-[min(52vh,480px)] max-h-[min(80vh,760px)] flex-col">
              <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
                <p className="text-sm font-medium text-cosmic-gold/80">Clavardage avec la guilde</p>
                <button
                  type="button"
                  onClick={() => setShowHistoryDrawer(true)}
                  className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-cosmic-gold/80 hover:bg-cosmic-gold/10 transition"
                  title="Historique des conversations archivées"
                  aria-label="Ouvrir l’historique des conversations archivées"
                >
                  <History className="h-4 w-4" />
                  {archivedThreads.length > 0 ? (
                    <span className="absolute -right-0.5 -top-0.5 min-w-[1.125rem] rounded-full bg-cosmic-gold px-1 text-center text-[10px] font-bold leading-tight text-cosmic-purple">
                      {archivedThreads.length > 99 ? '99+' : archivedThreads.length}
                    </span>
                  ) : null}
                </button>
              </div>

              <div
                ref={threadRef}
                className="min-h-0 flex-1 overflow-y-auto flex flex-col gap-7 border-l border-cosmic-gold/15 pl-3 sm:pl-4 pr-1 sm:pr-2 scroll-pb-28"
              >
                {messages.length === 0 ? (
                  <div className="max-w-prose">
                    <p className="flex items-baseline gap-1 text-[11px] uppercase tracking-wide text-cosmic-gold/40">
                      <JournalSpeakerGlyph speaker="Guilde" />
                      <span>Guilde</span>
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-cosmic-gold/90 whitespace-pre-wrap">
                      {JOURNAL_EMPTY_THREAD_WELCOME}
                    </p>
                  </div>
                ) : (
                  messages.map((m) =>
                    m.role === 'user' ? (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="ml-auto max-w-[min(100%,40rem)] text-right"
                      >
                        <p className="text-[11px] text-cosmic-gold/45">
                          <JournalSpeakerGlyph speaker="Toi" />
                          Toi · {new Date(m.created_at).toLocaleString('fr-CA')}
                        </p>
                        <p className="mt-1.5 text-left text-[15px] leading-7 text-cosmic-gold whitespace-pre-wrap rounded-xl bg-cosmic-gold/[0.09] px-3.5 py-2.5">
                          {m.content}
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-[min(100%,46rem)]"
                      >
                        <p className="text-[11px] text-cosmic-gold/45">
                          <JournalSpeakerGlyph speaker="Guilde" />
                          Guilde · {new Date(m.created_at).toLocaleString('fr-CA')}
                        </p>
                        <div className="mt-2.5 flex flex-col gap-5">
                          {parseJournalChat(m.content).map((bubble, idx) => {
                            const isAstrology = bubble.speaker.trim().toLowerCase() === 'astrologie'
                            return (
                              <div key={`${m.id}-${idx}`} className={`${isAstrology ? 'max-w-prose' : ''} rounded-lg px-1`}>
                                <p className="text-[11px] uppercase tracking-wide text-cosmic-gold/45">
                                  <JournalSpeakerGlyph speaker={bubble.speaker} />
                                  {bubble.speaker}
                                </p>
                                <p className="mt-1.5 text-[15px] leading-7 text-cosmic-gold/95 whitespace-pre-wrap">
                                  {bubble.body}
                                </p>
                              </div>
                            )
                          })}
                        </div>
                      </motion.div>
                    )
                  )
                )}
              </div>

              {!isNearBottom ? (
                <div className="mt-3 flex justify-center">
                  <button
                    type="button"
                    onClick={() => scrollThreadToBottom('smooth')}
                    className="rounded-full border border-cosmic-gold/40 bg-cosmic-purple/70 px-3 py-1 text-xs text-cosmic-gold hover:bg-cosmic-purple/90 transition"
                  >
                    Revenir au dernier message
                  </button>
                </div>
              ) : null}

              <form
                onSubmit={submitEntry}
                className="sticky bottom-0 mt-4 shrink-0 border-t border-cosmic-gold/10 bg-gradient-to-t from-cosmic-purple via-cosmic-purple/95 to-transparent pt-4 pb-1"
              >
                <label htmlFor="journal-entry-input" className="sr-only">
                  Message pour la guilde
                </label>
                <textarea
                  ref={entryTextareaRef}
                  id="journal-entry-input"
                  value={entryInput}
                  onChange={(e) => setEntryInput(e.target.value)}
                  rows={2}
                  className="w-full resize-none min-h-[3.5rem] max-h-[11rem] border-0 border-b border-cosmic-gold/20 bg-transparent px-0 py-2 text-sm leading-relaxed text-cosmic-gold placeholder:text-cosmic-gold/35 outline-none transition focus:border-cosmic-gold/45"
                  placeholder="Écris la suite du fil ici…"
                  maxLength={4000}
                />
                <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-[11px] text-cosmic-gold/40">{entryInput.length}/4000</span>
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
                    <button
                      type="button"
                      onClick={() => setShowArchiveConfirm(true)}
                      disabled={endingConversation || messages.length === 0 || sendingEntry}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-cosmic-gold/75 underline decoration-cosmic-gold/25 underline-offset-4 hover:text-cosmic-gold hover:decoration-cosmic-gold/50 disabled:opacity-40 sm:w-auto"
                    >
                      <Archive className="h-4 w-4 shrink-0 opacity-70" />
                      {endingConversation ? 'Archivage...' : 'Fin de la conversation'}
                    </button>
                    <button
                      type="submit"
                      disabled={sendingEntry || !entryInput.trim()}
                      className="w-full rounded-lg bg-cosmic-gold px-5 py-2 text-sm font-semibold text-cosmic-purple hover:bg-cosmic-gold/90 transition disabled:opacity-50 sm:w-auto"
                    >
                      {sendingEntry ? 'En train de répondre...' : 'Envoyer'}
                    </button>
                  </div>
                </div>
              </form>
            </section>
          </>
        ) : null}
      </div>
      {showHistoryDrawer ? (
        <div className="fixed inset-0 z-30 flex">
          <button
            type="button"
            className="min-h-0 flex-1 bg-black/55"
            aria-label="Fermer l’historique"
            onClick={() => setShowHistoryDrawer(false)}
          />
          <aside
            className="flex h-full w-full max-w-md shrink-0 flex-col border-l border-cosmic-gold/35 bg-gradient-to-b from-cosmic-purple to-magenta-purple shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="journal-history-title"
          >
            <div className="flex items-center justify-between gap-2 border-b border-cosmic-gold/25 px-4 py-3">
              <h2 id="journal-history-title" className="text-lg font-semibold text-cosmic-gold">
                Historique
              </h2>
              <button
                type="button"
                onClick={() => setShowHistoryDrawer(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-cosmic-gold/35 text-cosmic-gold hover:bg-cosmic-gold/10 transition"
                aria-label="Fermer le panneau"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4 flex flex-col gap-3">
              <p className="text-xs text-cosmic-gold/70">
                Conversations archivées (compte ou cet appareil). Touche une entrée pour relire le fil.
              </p>
              <div className="p-3 rounded-xl border border-cosmic-gold/30 bg-cosmic-purple/20 backdrop-blur-sm">
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
                            {thread.archive_title?.trim() || 'Conversation archivée'}
                          </div>
                          <div className="text-xs text-cosmic-gold/70 mt-1">
                            {thread.archived_at || thread.updated_at
                              ? `Archivée le ${new Date(thread.archived_at || thread.updated_at).toLocaleString('fr-CA')} · `
                              : null}
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
                <div className="p-3 rounded-xl border border-cosmic-gold/25 bg-black/20 max-h-[min(50vh,380px)] overflow-y-auto flex flex-col gap-2">
                  <p className="text-xs uppercase tracking-wide text-cosmic-gold/65">
                    Historique ouvert ·{' '}
                    {new Date(
                      archivedThreads.find((t) => t.id === selectedArchive.id)?.archived_at || '',
                    ).toLocaleString('fr-CA')}
                  </p>
                  {selectedArchive.messages.map((m) =>
                    m.role === 'user' ? (
                      <div key={m.id} className="rounded-lg border border-cosmic-gold/20 bg-cosmic-purple/25 px-3 py-2">
                        <div className="mb-1 text-[10px] uppercase tracking-wide text-cosmic-gold/60">
                          <JournalSpeakerGlyph speaker="Toi" />
                          Toi · {new Date(m.created_at).toLocaleString('fr-CA')}
                        </div>
                        <div className="text-sm text-cosmic-gold whitespace-pre-wrap">{m.content}</div>
                      </div>
                    ) : (
                      <div key={m.id} className="rounded-lg border border-cosmic-gold/20 bg-cosmic-purple/25 px-3 py-2">
                        <div className="mb-1 text-[10px] uppercase tracking-wide text-cosmic-gold/60">
                          <JournalSpeakerGlyph speaker="Guilde" />
                          Guilde · {new Date(m.created_at).toLocaleString('fr-CA')}
                        </div>
                        <div className="mt-1 flex flex-col gap-3">
                          {parseJournalChat(m.content).map((bubble, idx) => (
                            <div key={`${m.id}-${idx}`}>
                              <p className="text-[10px] uppercase tracking-wide text-cosmic-gold/55">
                                <JournalSpeakerGlyph speaker={bubble.speaker} />
                                {bubble.speaker}
                              </p>
                              <p className="mt-0.5 text-sm text-cosmic-gold whitespace-pre-wrap">{bubble.body}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}
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
