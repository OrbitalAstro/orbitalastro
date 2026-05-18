import { describe, expect, it } from 'vitest'
import {
  enforceJournalDeepenReply,
  extractJournalDeepenTargetRole,
  isJournalDeepenMessage,
} from '@/lib/journal-deepen'
import { parseJournalGuildReply } from '@/lib/journal-chat-parse'
import { journalDeepenBubbleMessage } from '@/lib/journal-chat-suggestions'
import { resolveJournalGuildVoiceBudget } from '@/lib/journal-guild-chorus'

describe('journal deepen', () => {
  it('détecte le message bouton Approfondir', () => {
    const msg = journalDeepenBubbleMessage('Saturne', 'Je te demande de structurer.')
    expect(isJournalDeepenMessage(msg)).toBe(true)
    expect(extractJournalDeepenTargetRole(msg)).toBe('Saturne')
  })

  it('budget deepen (pas chœur)', () => {
    expect(
      resolveJournalGuildVoiceBudget({
        concreteFollowUp: false,
        isAnotherVoiceFollowUp: false,
        isDeepenFollowUp: true,
        isTouchedReaction: false,
        responseMode: 'messaging',
      }),
    ).toBe('deepen')
  })

  it('enforce coupe le chœur en trop', () => {
    const raw = `Astrologie: Table longue…
Saturne (Natal: Capricorne, maison 8 + Transit: Bélier, maison 5): Je structure ton quotidien.
Mars (Natal: Lion, maison 1 + Transit: Taureau, maison 2): Je pousse.
Lune (Natal: Balance, maison 5 + Transit: Bélier, maison 5): Je sens.`
    const out = enforceJournalDeepenReply(raw, 'Saturne')
    const bubbles = parseJournalGuildReply(out)
    expect(bubbles.length).toBeLessThanOrEqual(2)
    expect(bubbles[0]?.speaker).toMatch(/^Saturne/i)
  })

  it('concret prime sur approfondir', () => {
    expect(
      resolveJournalGuildVoiceBudget({
        concreteFollowUp: true,
        isAnotherVoiceFollowUp: false,
        isDeepenFollowUp: true,
        isTouchedReaction: false,
        responseMode: 'messaging',
      }),
    ).toBe('concrete')
  })
})
