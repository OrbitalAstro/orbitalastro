'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Copy, Download, FileText } from 'lucide-react'
import {
  downloadJournalExportFile,
  formatJournalConversationHtml,
  formatJournalConversationMarkdown,
  journalExportFilename,
  type JournalExportMessage,
} from '@/lib/journal-export-conversation'

type Props = {
  messages: JournalExportMessage[]
  profileName?: string | null
  title?: string
  disabled?: boolean
  /** Libellé court sur mobile */
  compact?: boolean
}

export default function JournalExportConversationButton({
  messages,
  profileName,
  title = 'Journal pilote — conversation en cours',
  disabled,
  compact,
}: Props) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  const canExport = messages.length > 0 && !disabled

  function exportMarkdown() {
    const md = formatJournalConversationMarkdown(messages, {
      title,
      profileName,
      includeRepetitionReport: true,
    })
    downloadJournalExportFile(journalExportFilename('md'), md, 'text/markdown;charset=utf-8')
    setOpen(false)
  }

  function exportHtml() {
    const html = formatJournalConversationHtml(messages, {
      title,
      profileName,
      includeRepetitionReport: true,
    })
    downloadJournalExportFile(journalExportFilename('html'), html, 'text/html;charset=utf-8')
    setOpen(false)
  }

  async function copyMarkdown() {
    const md = formatJournalConversationMarkdown(messages, {
      title,
      profileName,
      includeRepetitionReport: true,
    })
    await navigator.clipboard.writeText(md)
    setCopied(true)
    setOpen(false)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        disabled={!canExport}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 items-center gap-1 rounded-full border border-cosmic-gold/35 bg-cosmic-purple/40 px-2.5 text-cosmic-gold/85 hover:bg-cosmic-gold/10 transition disabled:opacity-50"
        title="Exporter la conversation"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {copied ? <Check className="h-4 w-4" /> : <Download className="h-4 w-4" />}
        {!compact ? <span className="text-xs font-medium">Exporter</span> : null}
        <ChevronDown className="h-3.5 w-3.5 opacity-70" />
      </button>
      {open && canExport ? (
        <div
          className="absolute right-0 top-full z-40 mt-1 min-w-[15.5rem] rounded-xl border border-cosmic-gold/35 bg-cosmic-purple/95 py-1 shadow-xl backdrop-blur-md"
          role="menu"
        >
          <p className="px-3 py-2 text-[11px] leading-snug text-cosmic-gold/65 border-b border-cosmic-gold/20">
            Pour repérer les répétitions : le <strong className="font-medium text-cosmic-gold/85">.md</strong>{' '}
            inclut un repère auto en tête de fichier.
          </p>
          <button
            type="button"
            role="menuitem"
            onClick={() => exportMarkdown()}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-cosmic-gold/90 hover:bg-cosmic-gold/10"
          >
            <FileText className="h-4 w-4 shrink-0" />
            Markdown (.md) — recommandé
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => exportHtml()}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-cosmic-gold/90 hover:bg-cosmic-gold/10"
          >
            <Download className="h-4 w-4 shrink-0" />
            HTML — ouvrir dans Word
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => void copyMarkdown()}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-cosmic-gold/90 hover:bg-cosmic-gold/10"
          >
            <Copy className="h-4 w-4 shrink-0" />
            Copier (Markdown)
          </button>
        </div>
      ) : null}
    </div>
  )
}
