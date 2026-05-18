import { describe, expect, it } from 'vitest'
import { resolveJournalGuildVoiceBudget } from '@/lib/journal-guild-chorus'
import { detectJournalWeekTransitHorizon } from '@/lib/journal-transit-horizon'

describe('detectJournalWeekTransitHorizon', () => {
  it('détecte transits de la semaine', () => {
    expect(detectJournalWeekTransitHorizon('Transits de la semaine', '')).toBe(true)
  })
})

describe('resolveJournalGuildVoiceBudget', () => {
  it('chœur 5–7 par défaut', () => {
    expect(
      resolveJournalGuildVoiceBudget({
        concreteFollowUp: false,
        isAnotherVoiceFollowUp: false,
        isDeepenFollowUp: false,
        isTouchedReaction: false,
        responseMode: 'messaging',
      }),
    ).toBe('chorus')
  })

  it('minimal pour relance ciblée', () => {
    expect(
      resolveJournalGuildVoiceBudget({
        concreteFollowUp: true,
        isAnotherVoiceFollowUp: false,
        isDeepenFollowUp: false,
        isTouchedReaction: false,
        responseMode: 'messaging',
      }),
    ).toBe('concrete')
  })
})
