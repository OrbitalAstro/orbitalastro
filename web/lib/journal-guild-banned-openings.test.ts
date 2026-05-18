import { describe, expect, it } from 'vitest'
import { stripJournalGuildBannedOpenings } from '@/lib/journal-guild-banned-openings'

describe('stripJournalGuildBannedOpenings', () => {
  it('retire la reformulation molle « je perçois ton envie de saisir… »', () => {
    const raw =
      "Je perçois bien ton envie de saisir les énergies qui te traversent en ce moment et comment elles se manifestent dans ton quotidien. Aujourd'hui, Saturne en Bélier oppose ta Lune."
    const out = stripJournalGuildBannedOpenings(raw)
    expect(out).not.toMatch(/envie de saisir/i)
    expect(out).toMatch(/^Aujourd'hui, Saturne/)
  })

  it('retire l’ouverture générique type excellente question', () => {
    const raw =
      "Je comprends que tu cherches à éclaircir où en est ton énergie aujourd'hui, et c'est une excellente question, car le ciel nous offre toujours des pistes pour mieux nous sentir. Jo, je perçois un mélange d'exigences."
    const out = stripJournalGuildBannedOpenings(raw)
    expect(out).not.toMatch(/excellente question/i)
    expect(out).toMatch(/^Jo, je perçois/)
  })
})
