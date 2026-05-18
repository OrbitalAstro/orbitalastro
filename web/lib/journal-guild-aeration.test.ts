import { describe, expect, it } from 'vitest'
import { aerateJournalGuildBody } from '@/lib/journal-guild-aeration'

describe('aerateJournalGuildBody', () => {
  it('insère des sauts avant les sections numérotées', () => {
    const raw =
      'Intro courte. 1. Tensions du moment : Saturne oppose ta Lune. 2. Fond natal : ta Lune en Balance.'
    const out = aerateJournalGuildBody(raw, 'Astrologie')
    expect(out).toMatch(/\n\n1\. Tensions/)
    expect(out).toMatch(/\n\n2\. Fond/)
  })

  it('découpe un long pavé en paragraphes', () => {
    const raw =
      'Phrase un. Phrase deux. Phrase trois. Phrase quatre. Phrase cinq. Phrase six.'
    const out = aerateJournalGuildBody(raw, 'Astrologie')
    expect(out).toContain('\n\n')
  })
})
