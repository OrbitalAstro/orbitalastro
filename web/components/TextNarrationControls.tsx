'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Volume2, Pause, Play, Square } from 'lucide-react'
import { prepareTextForNarration } from '@/lib/prepareTextForNarration'

export type NarrationLanguage = 'fr' | 'en' | 'es'

export type NarrationLabels = {
  listen: string
  pause: string
  resume: string
  stop: string
  unsupported: string
  hint: string
  voice: string
  voiceDefault: string
  voiceGroupRecommended: string
  voiceGroupOther: string
  voiceNote: string
}

function chunkText(text: string, maxLen = 480): string[] {
  const paragraphs = text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
  const merged: string[] = []
  let current = ''
  for (const p of paragraphs) {
    const next = current ? `${current}\n\n${p}` : p
    if (next.length > maxLen && current) {
      merged.push(current)
      current = p
    } else {
      current = next
    }
  }
  if (current) merged.push(current)

  const out: string[] = []
  for (const c of merged) {
    if (c.length <= maxLen) {
      out.push(c)
      continue
    }
    let rest = c
    while (rest.length > maxLen) {
      let slice = rest.slice(0, maxLen)
      const dot = slice.lastIndexOf('. ')
      if (dot > 100) slice = rest.slice(0, dot + 1)
      out.push(slice.trim())
      rest = rest.slice(slice.length).trim()
    }
    if (rest) out.push(rest)
  }
  return out.length ? out : [text]
}

function utteranceLang(lang: NarrationLanguage): string {
  if (lang === 'fr') return 'fr-CA'
  if (lang === 'es') return 'es-ES'
  return 'en-US'
}

function langPrefix(lang: NarrationLanguage): string {
  if (lang === 'fr') return 'fr'
  if (lang === 'es') return 'es'
  return 'en'
}

function voiceMatchesPageLang(voice: SpeechSynthesisVoice, language: NarrationLanguage): boolean {
  const prefix = langPrefix(language)
  const vl = (voice.lang || '').toLowerCase().replace('_', '-')
  return vl === prefix || vl.startsWith(`${prefix}-`)
}

function storageKey(language: NarrationLanguage): string {
  return `orbitalastro-tts-voiceuri-${language}`
}

function dedupeVoices(list: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  const seen = new Set<string>()
  const out: SpeechSynthesisVoice[] = []
  for (const v of list) {
    if (seen.has(v.voiceURI)) continue
    seen.add(v.voiceURI)
    out.push(v)
  }
  return out.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
}

type Props = {
  text: string
  language: NarrationLanguage
  labels: NarrationLabels
  className?: string
}

export default function TextNarrationControls({ text, language, labels, className = '' }: Props) {
  const [supported, setSupported] = useState(true)
  const [phase, setPhase] = useState<'idle' | 'playing' | 'paused'>('idle')
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoiceUri, setSelectedVoiceUri] = useState('')
  const chunksRef = useRef<string[]>([])

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSupported(false)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    const synth = window.speechSynthesis
    const refresh = () => setVoices(dedupeVoices(synth.getVoices()))
    refresh()
    synth.addEventListener('voiceschanged', refresh)
    return () => synth.removeEventListener('voiceschanged', refresh)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    setSelectedVoiceUri(localStorage.getItem(storageKey(language)) || '')
  }, [language])

  useEffect(() => {
    if (!voices.length || typeof window === 'undefined') return
    const key = storageKey(language)
    const saved = localStorage.getItem(key)
    if (saved && !voices.some((v) => v.voiceURI === saved)) {
      localStorage.removeItem(key)
      setSelectedVoiceUri('')
    }
  }, [voices, language])

  const stopAll = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setPhase('idle')
  }, [])

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  useEffect(() => {
    stopAll()
  }, [text, stopAll])

  const resolveVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (!selectedVoiceUri || !window.speechSynthesis) return null
    return window.speechSynthesis.getVoices().find((v) => v.voiceURI === selectedVoiceUri) || null
  }, [selectedVoiceUri])

  const speakFromIndex = useCallback(
    (index: number) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) return
      const chunks = chunksRef.current
      if (index >= chunks.length) {
        setPhase('idle')
        return
      }
      const u = new SpeechSynthesisUtterance(chunks[index])
      const picked = resolveVoice()
      if (picked) {
        u.voice = picked
      }
      u.lang = utteranceLang(language)
      u.rate = 0.92
      u.onend = () => speakFromIndex(index + 1)
      u.onerror = () => setPhase('idle')
      window.speechSynthesis.speak(u)
    },
    [language, resolveVoice],
  )

  const handleStart = useCallback(() => {
    if (!supported || !text.trim()) return
    window.speechSynthesis.cancel()
    const prepared = prepareTextForNarration(text)
    chunksRef.current = chunkText(prepared)
    setPhase('playing')
    speakFromIndex(0)
  }, [supported, text, speakFromIndex])

  const handlePause = useCallback(() => {
    try {
      window.speechSynthesis.pause()
      setPhase('paused')
    } catch {
      setPhase('idle')
    }
  }, [])

  const handleResume = useCallback(() => {
    try {
      window.speechSynthesis.resume()
      setPhase('playing')
    } catch {
      handleStart()
    }
  }, [handleStart])

  const recommended = voices.filter((v) => voiceMatchesPageLang(v, language))
  const other = voices.filter((v) => !voiceMatchesPageLang(v, language))

  const onVoiceSelect = (uri: string) => {
    setSelectedVoiceUri(uri)
    const key = storageKey(language)
    if (uri) localStorage.setItem(key, uri)
    else localStorage.removeItem(key)
  }

  if (!supported) {
    return (
      <p className={`text-xs text-cosmic-gold/60 ${className}`} role="status">
        {labels.unsupported}
      </p>
    )
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex flex-wrap gap-2">
        {phase === 'idle' ? (
          <button
            type="button"
            onClick={handleStart}
            disabled={!text.trim()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-cosmic-gold/50 bg-cosmic-purple/40 text-cosmic-gold hover:bg-cosmic-gold/15 transition disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label={labels.listen}
          >
            <Volume2 className="h-4 w-4 shrink-0" />
            <span>{labels.listen}</span>
          </button>
        ) : null}
        {phase === 'playing' ? (
          <>
            <button
              type="button"
              onClick={handlePause}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-cosmic-gold/50 bg-cosmic-purple/40 text-cosmic-gold hover:bg-cosmic-gold/15 transition"
              aria-label={labels.pause}
            >
              <Pause className="h-4 w-4 shrink-0" />
              <span>{labels.pause}</span>
            </button>
            <button
              type="button"
              onClick={stopAll}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-white/20 bg-white/5 text-white/90 hover:bg-white/10 transition"
              aria-label={labels.stop}
            >
              <Square className="h-4 w-4 shrink-0" />
              <span>{labels.stop}</span>
            </button>
          </>
        ) : null}
        {phase === 'paused' ? (
          <>
            <button
              type="button"
              onClick={handleResume}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-cosmic-gold/50 bg-cosmic-purple/40 text-cosmic-gold hover:bg-cosmic-gold/15 transition"
              aria-label={labels.resume}
            >
              <Play className="h-4 w-4 shrink-0" />
              <span>{labels.resume}</span>
            </button>
            <button
              type="button"
              onClick={stopAll}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-white/20 bg-white/5 text-white/90 hover:bg-white/10 transition"
              aria-label={labels.stop}
            >
              <Square className="h-4 w-4 shrink-0" />
              <span>{labels.stop}</span>
            </button>
          </>
        ) : null}
      </div>

      {voices.length > 0 ? (
        <div className="flex flex-col gap-1 max-w-xl">
          <label htmlFor="orbitalastro-tts-voice" className="text-xs text-cosmic-gold/80">
            {labels.voice}
          </label>
          <select
            id="orbitalastro-tts-voice"
            value={selectedVoiceUri}
            onChange={(e) => onVoiceSelect(e.target.value)}
            className="text-sm rounded-lg border border-white/15 bg-white/5 text-white/90 px-3 py-2 max-w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-cosmic-gold/60"
          >
            <option value="">{labels.voiceDefault}</option>
            {recommended.length > 0 ? (
              <optgroup label={labels.voiceGroupRecommended}>
                {recommended.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name}
                    {v.default ? ' ★' : ''}
                  </option>
                ))}
              </optgroup>
            ) : null}
            {other.length > 0 ? (
              <optgroup label={labels.voiceGroupOther}>
                {other.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </optgroup>
            ) : null}
          </select>
          <p className="text-xs text-cosmic-gold/55">{labels.voiceNote}</p>
        </div>
      ) : null}

      <p className="text-xs text-cosmic-gold/55 max-w-xl">{labels.hint}</p>
    </div>
  )
}
