/**
 * Régression journal pilote — brièveté, chœur 2–3, modes sur demande (approfondir, etc.).
 */
import { describe, expect, it } from 'vitest'
import {
  enforceJournalSingleVoiceReply,
  extractJournalAnotherVoiceRole,
  isJournalAnotherVoiceMessage,
  journalAnotherVoiceMessage,
} from '@/lib/journal-another-voice'
import { parseJournalGuildReply } from '@/lib/journal-chat-parse'
import {
  journalConcretePathBubbleMessage,
  journalDeepenBubbleMessage,
} from '@/lib/journal-chat-suggestions'
import {
  enforceJournalDeepenReply,
  extractJournalDeepenTargetRole,
  isJournalDeepenMessage,
  JOURNAL_DEEPEN_MAX_BUBBLES,
} from '@/lib/journal-deepen'
import {
  enforceJournalConcreteFollowUpReply,
  extractJournalConcreteTargetRole,
  isJournalConcreteFollowUp,
} from '@/lib/journal-follow-up'
import {
  journalAstrologieReadingUserHint,
} from '@/lib/journal-astrologie-reading'
import {
  JOURNAL_ASTRO_SECTION_MAX_SENTENCES,
  JOURNAL_MAX_OUTPUT_TOKENS_DEFAULT,
  JOURNAL_MAX_OUTPUT_TOKENS_TOUCHED,
  JOURNAL_PLANET_VOICE_MAX_SENTENCES,
  journalGuildBrevitySystemBlock,
  journalGuildBrevityUserHint,
} from '@/lib/journal-guild-brevity'
import {
  detectJournalGuildChorusIssues,
  detectJournalGuildDeepenIssues,
  detectJournalGuildSingleVoiceIssues,
  journalGuildChorusSystemBlock,
  journalGuildPlanetVoiceRangeLabel,
  JOURNAL_GUILD_PLANET_VOICES_MAX,
  JOURNAL_GUILD_PLANET_VOICES_MIN,
  resolveJournalGuildVoiceBudget,
} from '@/lib/journal-guild-chorus'
import { buildJournalGuildSystemInstruction } from '@/lib/journal-guild-prompt'
import {
  journalResponseModeSystemBlock,
  journalResponseModeUserHint,
} from '@/lib/journal-response-mode'

function planetBubble(name: string, body = 'Effet court en une phrase.') {
  return `${name} (Natal: Bélier, maison 1 + Transit: Taureau, maison 2):\n${body}`
}

function chorusReply(planetNames: string[]): string {
  const planets = planetNames.map((n) => planetBubble(n)).join('\n\n')
  return `Astrologie:\n1. Tensions du moment :\n\nCourt.\n\n${planets}`
}

describe('journal — plafonds chœur (coût)', () => {
  it('MIN/MAX = 2–3 planètes', () => {
    expect(JOURNAL_GUILD_PLANET_VOICES_MIN).toBe(2)
    expect(JOURNAL_GUILD_PLANET_VOICES_MAX).toBe(3)
    expect(journalGuildPlanetVoiceRangeLabel()).toBe('2 à 3')
  })

  it('accepte un chœur de 2 ou 3 planètes', () => {
    expect(detectJournalGuildChorusIssues(chorusReply(['Lune', 'Mars']), 'chorus')).toEqual([])
    expect(detectJournalGuildChorusIssues(chorusReply(['Lune', 'Mars', 'Vénus']), 'chorus')).toEqual([])
  })

  it('signale chœur incomplet (1 planète)', () => {
    const issues = detectJournalGuildChorusIssues(chorusReply(['Lune']), 'chorus')
    expect(issues.length).toBeGreaterThan(0)
    expect(issues[0]).toContain('2')
  })

  it('signale trop de planètes (4+)', () => {
    const issues = detectJournalGuildChorusIssues(
      chorusReply(['Lune', 'Mars', 'Vénus', 'Mercure']),
      'chorus',
    )
    expect(issues.some((i) => i.includes('3'))).toBe(true)
  })

  it('n’applique pas le chœur en mode approfondir', () => {
    const issues = detectJournalGuildChorusIssues(chorusReply(['Lune']), 'deepen')
    expect(issues).toEqual([])
  })
})

describe('journal — brièveté (prompts)', () => {
  it('bloc système : chœur court + exception sur demande', () => {
    const block = journalGuildBrevitySystemBlock()
    expect(block).toContain('2 à 3')
    expect(block).toContain(`${JOURNAL_PLANET_VOICE_MAX_SENTENCES} phrase`)
    expect(block).toContain('Approfondir')
    expect(block).toContain('4 à 7 phrases')
    expect(block).toContain(`${JOURNAL_ASTRO_SECTION_MAX_SENTENCES} phrases max`)
  })

  it('hint utilisateur rappelle la synthèse', () => {
    expect(journalGuildBrevityUserHint()).toMatch(/Court|synthétique/i)
    expect(journalGuildBrevityUserHint()).toContain('1 phrase')
  })

  it('plafonds tokens sortie réduits vs ancien 8192', () => {
    expect(JOURNAL_MAX_OUTPUT_TOKENS_DEFAULT).toBeLessThanOrEqual(4096)
    expect(JOURNAL_MAX_OUTPUT_TOKENS_TOUCHED).toBeLessThanOrEqual(1024)
  })

  it('consigne chœur dans le prompt système', () => {
    expect(journalGuildChorusSystemBlock()).toContain('2 à 3')
    expect(journalGuildChorusSystemBlock()).toContain('1 phrase')
  })

  it('buildJournalGuildSystemInstruction inclut BRIÈVETÉ en mode chorus', () => {
    const sys = buildJournalGuildSystemInstruction({
      displayName: 'Test',
      natalSummary: 'Soleil Bélier',
      astroTimingBlock: 'Bloc',
      journalDate: '2026-05-16',
      voiceBudget: 'chorus',
    })
    expect(sys).toContain('BRIÈVETÉ')
    expect(sys).toContain('CHŒUR DE LA GUILDE')
    expect(sys).toMatch(/2 à 3/)
  })

  it('buildJournalGuildSystemInstruction sans chœur en mode deepen', () => {
    const sys = buildJournalGuildSystemInstruction({
      displayName: 'Test',
      natalSummary: 'Soleil Bélier',
      astroTimingBlock: 'Bloc',
      journalDate: '2026-05-16',
      voiceBudget: 'deepen',
      citedDeepenRole: 'Saturne',
    })
    expect(sys).toContain('BRIÈVETÉ')
    expect(sys).not.toContain('CHŒUR DE LA GUILDE')
    expect(sys).toContain('APPROFONDIR')
  })
})

describe('journal — budget de voix (resolveJournalGuildVoiceBudget)', () => {
  const base = {
    concreteFollowUp: false,
    isAnotherVoiceFollowUp: false,
    isDeepenFollowUp: false,
    isTouchedReaction: false,
    responseMode: 'messaging' as const,
  }

  it('chorus par défaut sur question ouverte', () => {
    expect(resolveJournalGuildVoiceBudget(base)).toBe('chorus')
  })

  it('deepen sur Approfondir', () => {
    expect(resolveJournalGuildVoiceBudget({ ...base, isDeepenFollowUp: true })).toBe('deepen')
  })

  it('single sur Autre voix', () => {
    expect(
      resolveJournalGuildVoiceBudget({ ...base, isAnotherVoiceFollowUp: true }),
    ).toBe('single')
  })

  it('concrete sur piste concrète (prime sur deepen)', () => {
    expect(
      resolveJournalGuildVoiceBudget({
        ...base,
        concreteFollowUp: true,
        isDeepenFollowUp: true,
      }),
    ).toBe('concrete')
  })

  it('minimal sur réaction touchée', () => {
    expect(
      resolveJournalGuildVoiceBudget({ ...base, isTouchedReaction: true }),
    ).toBe('minimal')
  })
})

describe('journal — Approfondir (conversation 1 voix)', () => {
  it('détecte le message bouton', () => {
    const msg = journalDeepenBubbleMessage('Saturne', 'Je structure ton quotidien.')
    expect(isJournalDeepenMessage(msg)).toBe(true)
    expect(extractJournalDeepenTargetRole(msg)).toBe('Saturne')
  })

  it('mode deepen : 4–7 phrases dans les consignes', () => {
    expect(journalResponseModeSystemBlock('messaging', 'light', 'deepen')).toContain('4 à 7')
    expect(journalResponseModeUserHint('messaging', 'light', 'deepen')).toContain('4–7')
  })

  it('hint lecture astro sans chœur', () => {
    expect(journalAstrologieReadingUserHint({ deepenFollowUp: true })).toMatch(
      /4–7|pas de chœur/i,
    )
  })

  it('enforce coupe à 2 bulles max et garde la voix citée', () => {
    const raw = `Astrologie: Table longue…
${planetBubble('Saturne', 'Développement détaillé sur plusieurs phrases.')}
${planetBubble('Mars')}
${planetBubble('Lune')}`
    const out = enforceJournalDeepenReply(raw, 'Saturne')
    const bubbles = parseJournalGuildReply(out)
    expect(bubbles.length).toBeLessThanOrEqual(JOURNAL_DEEPEN_MAX_BUBBLES)
    expect(bubbles[0]?.speaker).toMatch(/^Saturne/i)
  })

  it('detectJournalGuildDeepenIssues refuse un chœur', () => {
    const issues = detectJournalGuildDeepenIssues(
      chorusReply(['Lune', 'Mars', 'Vénus']),
      'deepen',
      'Saturne',
    )
    expect(issues.length).toBeGreaterThan(0)
  })
})

describe('journal — Autre voix', () => {
  it('message menu + budget single', () => {
    const msg = journalAnotherVoiceMessage('Mars')
    expect(isJournalAnotherVoiceMessage(msg)).toBe(true)
    expect(extractJournalAnotherVoiceRole(msg)).toBe('Mars')
  })

  it('consignes 4–7 phrases', () => {
    expect(journalResponseModeSystemBlock('messaging', 'light', 'single')).toContain('4 à 7')
  })

  it('enforce une seule planète', () => {
    const raw = `Astrologie: long…
${planetBubble('Mars')}
${planetBubble('Lune')}`
    const out = enforceJournalSingleVoiceReply(raw, 'Mars')
    expect(parseJournalGuildReply(out).length).toBe(1)
    expect(out).toMatch(/^Mars /i)
  })

  it('detectJournalGuildSingleVoiceIssues si chœur', () => {
    const issues = detectJournalGuildSingleVoiceIssues(chorusReply(['Lune', 'Mars']), 'single')
    expect(issues.length).toBeGreaterThan(0)
  })
})

describe('journal — Piste concrète', () => {
  it('détecte et extrait via message bouton (apostrophe typographique)', () => {
    const msg = journalConcretePathBubbleMessage('Saturne', 'Je structure ton quotidien.')
    expect(isJournalConcreteFollowUp(msg)).toBe(true)
    expect(extractJournalConcreteTargetRole(msg)).toBe('Saturne')
  })

  it('mode concrete : 4–6 phrases', () => {
    expect(journalResponseModeSystemBlock('targeted', 'light', 'concrete')).toContain('4 à 6')
  })

  it('enforce garde la voix citée seule', () => {
    const raw = `Astrologie: Note tes hésitations.

${planetBubble('Chiron', 'Observe sans juger chaque jour.')}`
    const out = enforceJournalConcreteFollowUpReply(raw, 'Chiron')
    expect(parseJournalGuildReply(out).length).toBe(1)
    expect(out).toMatch(/^Chiron /i)
  })
})
