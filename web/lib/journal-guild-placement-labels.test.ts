import { describe, expect, it } from 'vitest'
import { parseJournalGuildSpeakerLabel } from '@/lib/journal-guild-placement-labels'

describe('parseJournalGuildSpeakerLabel', () => {
  it('sépare nom et placements', () => {
    const r = parseJournalGuildSpeakerLabel(
      'Lune (Natal: Balance, maison 5 + Transit: Bélier, maison 5)',
    )
    expect(r.displayName).toBe('Lune')
    expect(r.placementCaption).toContain('Natal')
    expect(r.placementCaption).toContain('Transit')
  })
})
