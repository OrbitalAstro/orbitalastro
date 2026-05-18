import { describe, expect, it } from 'vitest'
import {
  enforceJournalSingleVoiceReply,
  extractJournalAnotherVoiceRole,
  isJournalAnotherVoiceMessage,
  journalAnotherVoiceMessage,
} from '@/lib/journal-another-voice'
import { parseJournalGuildReply } from '@/lib/journal-chat-parse'
import { resolveJournalGuildVoiceBudget } from '@/lib/journal-guild-chorus'

describe('journal another voice', () => {
  it('message menu court + affichage fil', () => {
    const msg = journalAnotherVoiceMessage('Mars')
    expect(isJournalAnotherVoiceMessage(msg)).toBe(true)
    expect(extractJournalAnotherVoiceRole(msg)).toBe('Mars')
    expect(
      resolveJournalGuildVoiceBudget({
        concreteFollowUp: false,
        isAnotherVoiceFollowUp: true,
        isDeepenFollowUp: false,
        isTouchedReaction: false,
        responseMode: 'messaging',
      }),
    ).toBe('single')
  })

  it('enforce préfère la voix choisie', () => {
    const raw = `Astrologie: long…
Mars (Natal: Capricorne, maison 8 + Transit: Taureau, maison 2): Je pousse.
Lune (Natal: Balance, maison 5 + Transit: Bélier, maison 5): Je sens.`
    const out = enforceJournalSingleVoiceReply(raw, 'Mars')
    expect(parseJournalGuildReply(out).length).toBe(1)
    expect(out).toMatch(/^Mars /i)
  })
})
