import { describe, expect, it } from 'vitest'
import {
  sanitizeJournalGuildReply,
  stripJournalGuildMarkdown,
  stripJournalGuildRoleLabel,
} from '@/lib/journal-guild-reply-sanitize'
import { parseJournalGuildReply } from '@/lib/journal-chat-parse'
import { parseJournalGuildSpeakerLabel } from '@/lib/journal-guild-placement-labels'

describe('stripJournalGuildMarkdown', () => {
  it('retire le gras', () => {
    expect(stripJournalGuildMarkdown('Le **Saturne** en Bélier')).toBe('Le Saturne en Bélier')
  })

  it('retire les titres de section Astrologie', () => {
    expect(stripJournalGuildMarkdown('1. **Tensions / défis du moment :**')).toBe(
      '1. Tensions / défis du moment :',
    )
  })

  it('retire les puces en début de ligne', () => {
    expect(stripJournalGuildMarkdown('*   Premier point\n*   Deuxième')).toBe(
      'Premier point\nDeuxième',
    )
  })
})

describe('stripJournalGuildRoleLabel', () => {
  it('conserve Natal + Transit en retirant le gras', () => {
    const label =
      '**Saturne (Natal: Capricorne, maison 8 + Transit: Bélier, maison 5)**'
    expect(stripJournalGuildRoleLabel(label)).toBe(
      'Saturne (Natal: Capricorne, maison 8 + Transit: Bélier, maison 5)',
    )
    const ui = parseJournalGuildSpeakerLabel(stripJournalGuildRoleLabel(label))
    expect(ui.displayName).toBe('Saturne')
    expect(ui.placementCaption).toContain('Natal')
    expect(ui.placementCaption).toContain('Transit')
  })

  it('conserve les étiquettes si seul le nom est en gras', () => {
    const label = '**Saturne** (Natal: Capricorne, maison 8 + Transit: Bélier, maison 5)'
    expect(stripJournalGuildRoleLabel(label)).toContain('(Natal:')
    expect(stripJournalGuildRoleLabel(label)).toContain('Transit:')
    const ui = parseJournalGuildSpeakerLabel(stripJournalGuildRoleLabel(label))
    expect(ui.displayName).toBe('Saturne')
    expect(ui.placementCaption).not.toBeNull()
  })

  it('retire le gras dans les signes du bloc placement', () => {
    const label =
      'Lune (Natal: **Balance**, maison 5 + Transit: **Bélier**, maison 5)'
    const out = stripJournalGuildRoleLabel(label)
    expect(out).toContain('Natal: Balance')
    expect(out).toContain('Transit: Bélier')
    expect(out).not.toMatch(/\*\*/)
  })
})

describe('sanitizeJournalGuildReply', () => {
  it('nettoie le markdown dans une bulle multiligne', () => {
    const raw = `Astrologie: Voici **Saturne** en Bélier.
*   Opposition à la **Lune**
Lune: Je ressens…`
    const out = sanitizeJournalGuildReply(raw)
    expect(out).not.toMatch(/\*\*/)
    expect(out).toContain('Saturne en Bélier')
  })

  it('conserve l’étiquette planète avec markdown sur la ligne rôle', () => {
    const raw = `**Saturne (Natal: Capricorne, maison 8 + Transit: Bélier, maison 5):** Je **ressens** la structure.`
    const out = sanitizeJournalGuildReply(raw)
    expect(out).not.toMatch(/\*\*/)
    expect(out).toContain('Saturne (Natal: Capricorne, maison 8 + Transit: Bélier, maison 5):')
    expect(out).toContain('Je ressens la structure')
    const bubble = parseJournalGuildReply(out)[0]
    expect(bubble?.speaker).toContain('Natal:')
    expect(bubble?.speaker).toContain('Transit:')
    const ui = parseJournalGuildSpeakerLabel(bubble?.speaker ?? '')
    expect(ui.placementCaption).not.toBeNull()
  })

  it('nettoie Astrologie sans toucher aux étiquettes planètes', () => {
    const raw = `Astrologie: **1. Tensions du moment :**

Saturne **en Bélier**.

**Saturne** (Natal: Capricorne, maison 8 + Transit: Bélier, maison 5): Je **structure** ton quotidien.`
    const out = sanitizeJournalGuildReply(raw)
    expect(out).not.toMatch(/\*\*/)
    const saturne = parseJournalGuildReply(out).find((b) => /saturne/i.test(b.speaker))
    expect(saturne?.speaker).toContain('Natal:')
    expect(saturne?.speaker).toContain('Transit:')
    expect(parseJournalGuildSpeakerLabel(saturne?.speaker ?? '').placementCaption).not.toBeNull()
  })
})
