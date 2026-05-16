import { describe, expect, it, afterEach } from 'vitest'
import { getJournalFreeAccessEmails, isJournalFreeAccessEmail } from '@/lib/journal-free-access'

describe('journal free access allowlist', () => {
  const prev = process.env.JOURNAL_FREE_ACCESS_EMAILS

  afterEach(() => {
    if (prev === undefined) delete process.env.JOURNAL_FREE_ACCESS_EMAILS
    else process.env.JOURNAL_FREE_ACCESS_EMAILS = prev
  })

  it('inclut les courriels de base', () => {
    expect(isJournalFreeAccessEmail('isabelle_fort10@hotmail.com')).toBe(true)
    expect(isJournalFreeAccessEmail('  JODIVERS@outlook.com ')).toBe(true)
    expect(isJournalFreeAccessEmail('fortierline@gmail.com')).toBe(true)
    expect(isJournalFreeAccessEmail('Melanie.Deshaies@gmail.com')).toBe(true)
    expect(isJournalFreeAccessEmail('genevieve.2.turcotte@gmail.com')).toBe(true)
  })

  it('rejette un courriel hors liste', () => {
    expect(isJournalFreeAccessEmail('stranger@example.com')).toBe(false)
  })

  it('fusionne JOURNAL_FREE_ACCESS_EMAILS', () => {
    process.env.JOURNAL_FREE_ACCESS_EMAILS = 'extra@orbitalastro.ca, bad-not-email'
    const set = getJournalFreeAccessEmails()
    expect(set.has('extra@orbitalastro.ca')).toBe(true)
    expect(set.has('isabelle_fort10@hotmail.com')).toBe(true)
    expect(set.has('bad-not-email')).toBe(false)
  })
})
