import { describe, expect, it } from 'vitest'
import {
  detectJournalGuildChorusIssues,
  JOURNAL_GUILD_PLANET_VOICES_MAX,
  JOURNAL_GUILD_PLANET_VOICES_MIN,
} from '@/lib/journal-guild-chorus'

describe('journal guild chorus limits', () => {
  it('exige au moins le minimum de voix planètes', () => {
    const reply = `Astrologie:
Court.

Lune (Natal: Balance + Transit: Scorpion):
Une phrase.`

    const issues = detectJournalGuildChorusIssues(reply, 'chorus')
    expect(issues.some((i) => i.includes(String(JOURNAL_GUILD_PLANET_VOICES_MIN)))).toBe(true)
  })

  it('signale trop de voix planètes', () => {
    const planets = ['Lune', 'Soleil', 'Mercure', 'Vénus', 'Mars']
    const body = planets
      .map(
        (p) =>
          `${p} (Natal: Bélier + Transit: Taureau):\nEffet court.`,
      )
      .join('\n\n')
    const reply = `Astrologie:\nTable.\n\n${body}`

    const issues = detectJournalGuildChorusIssues(reply, 'chorus')
    if (planets.length > JOURNAL_GUILD_PLANET_VOICES_MAX) {
      expect(issues.length).toBeGreaterThan(0)
    }
  })
})
