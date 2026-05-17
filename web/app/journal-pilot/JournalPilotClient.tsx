'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Archive, BookOpenText, ChevronLeft, History, Loader2, X } from 'lucide-react'
import { journalMonthlySubscription } from '@/lib/stripe'
import BackButton from '@/components/BackButton'
import AddToCartButton from '@/components/AddToCartButton'
import Link from 'next/link'
import Starfield from '@/components/Starfield'
import JournalBubbleBlockActions from '@/components/JournalBubbleBlockActions'
import JournalGuildSpeechBubble from '@/components/JournalGuildSpeechBubble'
import JournalSpeakerGlyph from '@/components/JournalSpeakerGlyph'
import { OrbitalOrbitsSpinner } from '@/components/OrbitalOrbitsGraphic'
import { parseJournalGuildReply } from '@/lib/journal-chat-parse'
import {
  journalConcretePathBubbleMessage,
  journalDeepenBubbleMessage,
  journalSuggestionsForThread,
  journalSuggestionsSectionTitle,
  JOURNAL_SUGGESTION_PILL_CLASS,
} from '@/lib/journal-chat-suggestions'
import {
  journalTouchedBubbleMessage,
  journalTouchedReactionDisplayText,
} from '@/lib/journal-touched-reaction'
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

const JOURNAL_SIGNIN = '/auth/signin?callbackUrl=/journal-pilot'
const JOURNAL_ONBOARDING = '/auth/onboarding?next=%2Fjournal-pilot'
const LOCAL_ARCHIVE_KEY = 'journal_pilot_local_archives_v1'

/** En-tête du fil côté réponses combinées (glyphe ✶). */
const JOURNAL_GUILD_HEADING = "l'Astrologie"
const JOURNAL_GUILD_HEADING_GLYPH = 'Astrologie'

export default function JournalPilotClient() {
  const [authGate, setAuthGate] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')
  const [subscriptionStatus, setSubscriptionStatus] = useState<'unknown' | 'active' | 'required'>('unknown')

  const [loading, setLoading] = useState(true)
  const [sendingEntry, setSendingEntry] = useState(false)
  /** Message utilisateur affiché tout de suite pendant l’attente de la réponse. */
  const [pendingUserText, setPendingUserText] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [archivedThreads, setArchivedThreads] = useState<ArchivedThread[]>([])
  const [selectedArchive, setSelectedArchive] = useState<{ id: string; messages: ChatMessage[] } | null>(null)
  const [entryInput, setEntryInput] = useState('')
  const [endingConversation, setEndingConversation] = useState(false)
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)
  const [loadingArchiveId, setLoadingArchiveId] = useState<string | null>(null)
  const threadRef = useRef<HTMLDivElement | null>(null)

  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false)
  const [isNearBottom, setIsNearBottom] = useState(true)
  const [touchedBubbleKeys, setTouchedBubbleKeys] = useState<Set<string>>(() => new Set())
  const entryTextareaRef = useRef<HTMLTextAreaElement | null>(null)

  const journalBubbleKey = (messageId: string, bubbleIdx: number) => `${messageId}:${bubbleIdx}`

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

  const emptyThreadWelcome = useMemo(() => {
    const raw = profile?.display_name?.trim()
    const first = raw ? raw.split(/\s+/)[0] : ''
    if (first) return `Bonjour ${first}, De quoi souhaites-tu jaser?`
    return 'Bonjour, De quoi souhaites-tu jaser?'
  }, [profile?.display_name])

  const chatSuggestions = useMemo(
    () => journalSuggestionsForThread(messages.length),
    [messages.length],
  )
  const chatSuggestionsTitle = useMemo(
    () => journalSuggestionsSectionTitle(messages.length),
    [messages.length],
  )

  const applySuggestion = useCallback((message: string) => {
    setEntryInput(message)
    setError(null)
    requestAnimationFrame(() => {
      entryTextareaRef.current?.focus()
    })
  }, [])

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

      const subRes = await fetch('/api/journal/subscription', { credentials: 'include' })
      const subJson = await subRes.json().catch(() => ({}))
      if (!subRes.ok) {
        throw new Error(subJson?.error || 'Erreur abonnement')
      }
      if (!subJson.subscribed) {
        setSubscriptionStatus('required')
        setLoading(false)
        return
      }
      setSubscriptionStatus('active')

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    async function gate() {
      const deadline = Date.now() + 3500
      let delayMs = 60
      let session = await getSession()
      while (!cancelled && !session?.user && Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, delayMs))
        delayMs = Math.min(Math.round(delayMs * 1.55), 500)
        session = await getSession()
      }
      if (cancelled) return
      if (!session?.user) {
        setAuthGate('unauthenticated')
        window.location.assign(JOURNAL_SIGNIN)
        return
      }
      setAuthGate('authenticated')
    }
    void gate()
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
    if (authGate !== 'authenticated' || typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('subscribed') !== 'true') return

    let cancelled = false
    async function confirmSubscription() {
      for (let i = 0; i < 8 && !cancelled; i++) {
        const res = await fetch('/api/journal/subscription', { credentials: 'include' })
        const data = await res.json().catch(() => ({}))
        if (data.subscribed) {
          setSubscriptionStatus('active')
          window.history.replaceState({}, '', '/journal-pilot')
          void fetchProfileAndChat()
          return
        }
        await new Promise((r) => setTimeout(r, 1500))
      }
    }
    void confirmSubscription()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authGate])

  const scrollThreadToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    requestAnimationFrame(() => {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior })
    })
  }, [])

  useEffect(() => {
    const checkNearBottom = () => {
      const doc = document.documentElement
      const distance = doc.scrollHeight - window.innerHeight - window.scrollY
      setIsNearBottom(distance < 160)
    }
    checkNearBottom()
    window.addEventListener('scroll', checkNearBottom, { passive: true })
    window.addEventListener('resize', checkNearBottom, { passive: true })
    return () => {
      window.removeEventListener('scroll', checkNearBottom)
      window.removeEventListener('resize', checkNearBottom)
    }
  }, [])

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const doc = document.documentElement
      const distance = doc.scrollHeight - window.innerHeight - window.scrollY
      setIsNearBottom(distance < 160)
    })
    return () => cancelAnimationFrame(id)
  }, [messages, sendingEntry, pendingUserText, entryInput])

  useEffect(() => {
    if (isNearBottom || sendingEntry) {
      scrollThreadToBottom('smooth')
    }
  }, [messages, sendingEntry, isNearBottom, scrollThreadToBottom])

  useEffect(() => {
    const el = entryTextareaRef.current
    if (!el) return
    const measure = () => {
      const computed = window.getComputedStyle(el)
      const lineHeight = Number.parseFloat(computed.lineHeight) || 24
      const minLines = 6
      const maxLines = 52
      const maxHeight = Math.min(
        Math.round(lineHeight * maxLines),
        Math.round(window.innerHeight * 0.58),
      )

      el.style.height = 'auto'
      const next = Math.min(el.scrollHeight, maxHeight)
      el.style.height = `${Math.max(next, Math.round(lineHeight * minLines))}px`
      el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden'
    }
    measure()
    window.addEventListener('resize', measure, { passive: true })
    return () => window.removeEventListener('resize', measure)
  }, [entryInput])

  const sendChatMessage = useCallback(async (text: string) => {
    const message = text.trim()
    if (!message || sendingEntry) return
    setSendingEntry(true)
    setPendingUserText(message)
    setEntryInput('')
    setError(null)
    try {
      const res = await fetch('/api/journal/chat', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
      const json = await res.json()
      if (!res.ok) {
        if (json?.code === 'PROFILE_INCOMPLETE') {
          throw new Error("Enregistre d'abord tes données de naissance dans ton profil pour activer le clavardage.")
        }
        throw new Error(json?.error || 'Erreur de génération')
      }
      const added: ChatMessage[] = json.messages || []
      if (added.length > 0) {
        setMessages((prev) => [...prev, ...added])
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Erreur inconnue'
      const friendly =
        raw === 'fetch failed' || /failed to fetch|networkerror/i.test(raw)
          ? 'Connexion au serveur impossible. Vérifie que Next.js (port 3001) et l’API Python (port 8000) sont démarrés, puis réessaie.'
          : raw
      setError(friendly)
    } finally {
      setSendingEntry(false)
      setPendingUserText(null)
    }
  }, [sendingEntry])

  async function submitEntry(e: React.FormEvent) {
    e.preventDefault()
    if (!entryInput.trim()) return
    await sendChatMessage(entryInput)
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

  const closeHistoryDrawer = useCallback(() => {
    setShowHistoryDrawer(false)
    setSelectedArchive(null)
  }, [])

  const backToArchiveList = useCallback(() => {
    setSelectedArchive(null)
  }, [])

  const selectedArchiveMeta = useMemo(
    () => (selectedArchive ? archivedThreads.find((t) => t.id === selectedArchive.id) : null),
    [archivedThreads, selectedArchive],
  )

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
            Ici tu ouvres une session de clavardage : tu poses des questions, tu lances des sujets, l&apos;Astrologie et sa
            guilde répondent en s&apos;appuyant sur ta carte du ciel et les transits, soit ton contexte astrologique.
          </p>
        </div>

        {error ? (
          <div className="mt-4 p-3 rounded-lg border border-red-400/40 bg-red-900/20 text-red-100">{error}</div>
        ) : null}

        {profileComplete && subscriptionStatus === 'required' ? (
          <div className="mt-8 rounded-xl border border-cosmic-gold/35 bg-cosmic-purple/50 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-cosmic-gold mb-2">Abonnement Journal pilote</h2>
            <p className="text-cosmic-gold/85 text-sm sm:text-base mb-4">
              Le clavardage avec l&apos;astrologie et la guilde nécessite un abonnement mensuel. Tu conserves ton compte et
              ton profil natal ; active l&apos;accès pour commencer une session.
            </p>
            <ul className="text-sm text-cosmic-gold/80 space-y-2 mb-6 list-disc pl-5">
              {journalMonthlySubscription.features?.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <p className="text-2xl font-bold text-cosmic-gold mb-6">
              {journalMonthlySubscription.price} $ CAD{' '}
              <span className="text-base font-normal text-cosmic-gold/70">/ mois</span>
            </p>
            <AddToCartButton
              productId="journal-monthly"
              label="Configurer et ajouter au panier"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-cosmic-gold px-6 py-3 font-semibold text-cosmic-purple hover:bg-cosmic-gold/90"
            />
            <p className="mt-4 text-sm text-cosmic-gold/70">
              Ou{' '}
              <Link href="/checkout" className="underline hover:text-cosmic-gold">
                ouvrir le panier
              </Link>{' '}
              pour finaliser l&apos;abonnement (naissance, confirmations et paiement).
            </p>
          </div>
        ) : null}

        {profileComplete && subscriptionStatus === 'active' ? (
          <>
            {/* Fil descendant continu : pas de « boîte » autour du dialogue — la zone de saisie prolonge le fil */}
            <section className="mt-8 flex flex-col pb-40 sm:pb-44">
              <div className="mb-2 flex shrink-0 items-center justify-end gap-2">
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

              <div className="journal-thread mx-auto w-full">
                <div ref={threadRef} className="flex flex-col">
                {messages.length === 0 ? (
                  <motion.div className="journal-thread__turn">
                    <p className="journal-thread__meta flex items-baseline gap-1">
                      <JournalSpeakerGlyph speaker={JOURNAL_GUILD_HEADING_GLYPH} />
                      <span>{JOURNAL_GUILD_HEADING}</span>
                    </p>
                    <p className="journal-guild-bubble__body mt-2">{emptyThreadWelcome}</p>
                  </motion.div>
                ) : (
                  messages.map((m) =>
                    m.role === 'user' ? (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="journal-thread__turn"
                      >
                        <p className="journal-thread__meta journal-thread__meta--user flex items-baseline justify-center gap-1">
                          <JournalSpeakerGlyph speaker="Toi" />
                          <span>Toi · {new Date(m.created_at).toLocaleString('fr-CA')}</span>
                        </p>
                        <div className="journal-user-bubble">
                          <div className="journal-user-bubble__frame">
                            <p className="journal-user-bubble__body">
                              {journalTouchedReactionDisplayText(m.content)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="journal-thread__turn"
                      >
                        <p className="journal-thread__meta flex items-baseline gap-1">
                          <JournalSpeakerGlyph speaker={JOURNAL_GUILD_HEADING_GLYPH} />
                          <span>
                            {JOURNAL_GUILD_HEADING} · {new Date(m.created_at).toLocaleString('fr-CA')}
                          </span>
                        </p>
                        <div className="journal-thread__blocks">
                          {parseJournalChat(m.content).map((bubble, idx) => (
                            <div key={`${m.id}-${idx}`} className="journal-thread__block">
                              <JournalGuildSpeechBubble speaker={bubble.speaker} colorIdx={idx}>
                                <p className="journal-guild-bubble__speaker">
                                  <JournalSpeakerGlyph speaker={bubble.speaker} />
                                  {bubble.speaker}
                                </p>
                                <p className="journal-guild-bubble__body">{bubble.body}</p>
                              </JournalGuildSpeechBubble>
                              <JournalBubbleBlockActions
                                align="left"
                                disabled={sendingEntry}
                                touched={touchedBubbleKeys.has(journalBubbleKey(m.id, idx))}
                                onTouched={() => {
                                  const key = journalBubbleKey(m.id, idx)
                                  if (touchedBubbleKeys.has(key) || sendingEntry) return
                                  setTouchedBubbleKeys((prev) => new Set(prev).add(key))
                                  void sendChatMessage(
                                    journalTouchedBubbleMessage(bubble.speaker, bubble.body),
                                  )
                                }}
                                onDeepen={() =>
                                  void sendChatMessage(
                                    journalDeepenBubbleMessage(bubble.speaker, bubble.body),
                                  )
                                }
                                onConcretePath={() =>
                                  void sendChatMessage(
                                    journalConcretePathBubbleMessage(bubble.speaker, bubble.body),
                                  )
                                }
                              />
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )
                  )
                )}
                {pendingUserText ? (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="journal-thread__turn"
                  >
                    <p className="journal-thread__meta journal-thread__meta--user flex items-baseline justify-center gap-1">
                      <JournalSpeakerGlyph speaker="Toi" />
                      <span>Toi · {new Date().toLocaleString('fr-CA')}</span>
                    </p>
                    <div className="journal-user-bubble">
                      <div className="journal-user-bubble__frame">
                        <p className="journal-user-bubble__body">
                          {journalTouchedReactionDisplayText(pendingUserText)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ) : null}
                </div>
              </div>

              {sendingEntry ? (
                <motion.div
                  className="journal-loading-stage"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  aria-live="polite"
                  aria-busy="true"
                >
                  <div className="journal-loading-stage__backdrop" aria-hidden />
                  <div className="journal-loading-stage__content">
                    <OrbitalOrbitsSpinner
                      size={248}
                      label="La guilde tisse sa réponse…"
                      align="center"
                    />
                  </div>
                </motion.div>
              ) : null}

              {!sendingEntry ? (
                <>
                  <motion.div
                    className={`journal-thread mx-auto w-full shrink-0 pb-2 ${messages.length === 0 ? 'mt-4' : 'mt-8'}`}
                  >
                    <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-cosmic-gold/55">
                      {chatSuggestionsTitle}
                    </p>
                    <motion.div
                      className="flex flex-wrap gap-2"
                      initial={false}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {chatSuggestions.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          disabled={sendingEntry}
                          onClick={() => applySuggestion(s.message)}
                          title={s.message}
                          className={`${JOURNAL_SUGGESTION_PILL_CLASS} text-left`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </motion.div>
                  </motion.div>

                  <form
                    id="journal-compose-form"
                    onSubmit={submitEntry}
                    className="journal-thread mx-auto mt-4 w-full shrink-0 pb-2"
                  >
                    <label htmlFor="journal-entry-input" className="sr-only">
                      Message pour la guilde
                    </label>
                    <textarea
                      ref={entryTextareaRef}
                      id="journal-entry-input"
                      value={entryInput}
                      onChange={(e) => setEntryInput(e.target.value)}
                      rows={6}
                      className="w-full resize-none min-h-0 max-h-none border-0 bg-transparent px-0 py-2 text-[15px] leading-relaxed text-cosmic-gold placeholder:text-cosmic-gold/60 outline-none ring-0 transition focus:outline-none focus:ring-0"
                      placeholder={
                        messages.length === 0
                          ? 'Écris ta question ici, ou choisis une suggestion…'
                          : 'Écris la suite du fil ici…'
                      }
                      maxLength={4000}
                    />
                  </form>
                </>
              ) : null}

              <div
                className="fixed bottom-0 left-0 right-0 z-20 border-t border-cosmic-gold/30 bg-cosmic-purple/93 backdrop-blur-md shadow-[0_-10px_36px_rgba(0,0,0,0.38)]"
              >
                <div className="mx-auto flex max-w-5xl flex-col-reverse gap-2 px-3 pb-[max(0.65rem,env(safe-area-inset-bottom))] pt-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                  <span className="text-[11px] font-medium tabular-nums text-cosmic-gold/80">
                    {entryInput.length}/4000
                  </span>
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
                    <button
                      type="button"
                      onClick={() => setShowArchiveConfirm(true)}
                      disabled={endingConversation || messages.length === 0 || sendingEntry}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg px-2 py-1.5 text-sm text-cosmic-gold/90 underline decoration-cosmic-gold/40 underline-offset-[5px] hover:text-cosmic-gold hover:decoration-cosmic-gold/70 disabled:opacity-50 sm:w-auto"
                    >
                      <Archive className="h-4 w-4 shrink-0 text-cosmic-gold/90" />
                      {endingConversation ? 'Archivage...' : 'Fin de la conversation'}
                    </button>
                    <button
                      type="submit"
                      form="journal-compose-form"
                      disabled={sendingEntry || !entryInput.trim()}
                      className="w-full rounded-lg bg-cosmic-gold px-5 py-2 text-sm font-semibold text-cosmic-purple hover:bg-cosmic-gold/90 transition disabled:opacity-50 sm:w-auto"
                    >
                      {sendingEntry ? 'En train de répondre...' : 'Envoyer'}
                    </button>
                  </div>
                </div>
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
            </section>
          </>
        ) : null}
      </div>
      {showHistoryDrawer ? (
        <div className="fixed inset-0 z-30 flex justify-end">
          <button
            type="button"
            className="hidden min-h-0 flex-1 bg-black/55 sm:block"
            aria-label="Fermer l’historique"
            onClick={closeHistoryDrawer}
          />
          <aside
            className="flex h-full w-full max-w-md shrink-0 flex-col border-l border-cosmic-gold/35 bg-gradient-to-b from-cosmic-purple to-magenta-purple shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="journal-history-title"
          >
            <div className="sticky top-0 z-10 shrink-0 border-b border-cosmic-gold/25 bg-gradient-to-b from-cosmic-purple to-magenta-purple px-3 py-3 sm:px-4">
              {selectedArchive ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={backToArchiveList}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cosmic-gold/35 text-cosmic-gold hover:bg-cosmic-gold/10 transition"
                    aria-label="Retour à la liste des conversations"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <h2 id="journal-history-title" className="min-w-0 flex-1 truncate text-base font-semibold text-cosmic-gold sm:text-lg">
                    {selectedArchiveMeta?.archive_title?.trim() || 'Conversation archivée'}
                  </h2>
                  <button
                    type="button"
                    onClick={closeHistoryDrawer}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cosmic-gold/35 text-cosmic-gold hover:bg-cosmic-gold/10 transition"
                    aria-label="Fermer l’historique"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <h2 id="journal-history-title" className="text-lg font-semibold text-cosmic-gold">
                    Historique
                  </h2>
                  <button
                    type="button"
                    onClick={closeHistoryDrawer}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-cosmic-gold/35 text-cosmic-gold hover:bg-cosmic-gold/10 transition"
                    aria-label="Fermer le panneau"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4 flex flex-col gap-3">
              {!selectedArchive ? (
                <>
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
                </>
              ) : (
                <motion.div className="journal-thread flex flex-col gap-3 pb-2">
                  {selectedArchiveMeta?.archived_at || selectedArchiveMeta?.updated_at ? (
                    <p className="journal-thread__meta mb-1 uppercase tracking-wide">
                      Archivée le{' '}
                      {new Date(
                        selectedArchiveMeta.archived_at || selectedArchiveMeta.updated_at || '',
                      ).toLocaleString('fr-CA')}
                    </p>
                  ) : null}
                  {selectedArchive.messages.map((m) =>
                    m.role === 'user' ? (
                      <div key={m.id} className="journal-thread__turn">
                        <p className="journal-thread__meta journal-thread__meta--user flex items-baseline justify-center gap-1">
                          <JournalSpeakerGlyph speaker="Toi" />
                          <span>Toi · {new Date(m.created_at).toLocaleString('fr-CA')}</span>
                        </p>
                        <div className="journal-user-bubble">
                          <div className="journal-user-bubble__frame">
                            <p className="journal-user-bubble__body">
                              {journalTouchedReactionDisplayText(m.content)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div key={m.id} className="journal-thread__turn">
                        <p className="journal-thread__meta flex items-baseline gap-1">
                          <JournalSpeakerGlyph speaker={JOURNAL_GUILD_HEADING_GLYPH} />
                          <span>
                            {JOURNAL_GUILD_HEADING} · {new Date(m.created_at).toLocaleString('fr-CA')}
                          </span>
                        </p>
                        <div className="journal-thread__blocks">
                          {parseJournalChat(m.content).map((bubble, idx) => (
                            <div key={`${m.id}-${idx}`} className="journal-thread__block">
                              <JournalGuildSpeechBubble
                                speaker={bubble.speaker}
                                colorIdx={idx}
                                compact
                              >
                                <p className="journal-guild-bubble__speaker">
                                  <JournalSpeakerGlyph speaker={bubble.speaker} />
                                  {bubble.speaker}
                                </p>
                                <p className="journal-guild-bubble__body">{bubble.body}</p>
                              </JournalGuildSpeechBubble>
                            </div>
                          ))}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>
            <div className="shrink-0 border-t border-cosmic-gold/25 bg-gradient-to-b from-cosmic-purple to-magenta-purple px-3 py-3 sm:px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={closeHistoryDrawer}
                className="w-full rounded-lg bg-cosmic-gold px-4 py-2.5 text-sm font-semibold text-cosmic-purple hover:bg-cosmic-gold/90 transition"
              >
                Revenir au journal courant
              </button>
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
    </div>
  )
}
