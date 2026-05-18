import { describe, expect, it } from 'vitest'
import { detectJournalResponseMode } from '@/lib/journal-response-mode'
import { resolveJournalGuildVoiceBudget } from '@/lib/journal-guild-chorus'
import {
  enforceJournalConcreteFollowUpReply,
  extractJournalConcreteTargetRole,
  isJournalConcreteFollowUp,
  threadHasStructuredAstroReading,
} from '@/lib/journal-follow-up'
import { parseJournalGuildReply } from '@/lib/journal-chat-parse'

describe('isJournalConcreteFollowUp', () => {
  it('détecte la relance suggestion Saturne', () => {
    const msg =
      "À partir de ce que Saturne vient d'évoquer (« Je suis là pour te demander… »), donne-moi une piste concrète et réaliste pour les prochains jours."
    expect(isJournalConcreteFollowUp(msg)).toBe(true)
    expect(extractJournalConcreteTargetRole(msg)).toBe('Saturne')
    expect(
      resolveJournalGuildVoiceBudget({
        concreteFollowUp: true,
        isAnotherVoiceFollowUp: false,
        isDeepenFollowUp: false,
        isTouchedReaction: false,
        responseMode: 'targeted',
      }),
    ).toBe('concrete')
  })

  it('enforce garde Chiron seul (pas Astrologie)', () => {
    const raw = `Astrologie: Note tes hésitations chaque jour.

Chiron (Natal: Bélier, maison 11 + Transit: Bélier, maison 11): Observe sans juger.`
    const out = enforceJournalConcreteFollowUpReply(raw, 'Chiron')
    expect(parseJournalGuildReply(out).length).toBe(1)
    expect(out).toMatch(/^Chiron /i)
  })

  it('ignore une question large sans relance', () => {
    expect(
      isJournalConcreteFollowUp("Où en est mon énergie aujourd'hui d'après le ciel ?"),
    ).toBe(false)
  })
})

describe('detectJournalResponseMode avec fil', () => {
  const prior = [
    { role: 'user', content: 'énergie' },
    {
      role: 'assistant',
      content: '1. **Tensions et défis du moment**\nSaturne opposé Lune',
    },
  ]

  it('passe en ciblé pour piste concrète après lecture', () => {
    const msg =
      "À partir de ce que Saturne vient d'évoquer, donne-moi une piste concrète et réaliste pour les prochains jours."
    expect(detectJournalResponseMode(msg, { prior })).toBe('targeted')
  })
})

describe('threadHasStructuredAstroReading', () => {
  it('reconnaît les sections 1–2–3', () => {
    expect(
      threadHasStructuredAstroReading([
        {
          role: 'assistant',
          content: '**1. Tensions et défis du moment**\nSaturne',
        },
      ]),
    ).toBe(true)
  })
})
