/**
 * Nettoyage des réponses guilde (Journal pilote) : auto-présentations interdites
 * (« je suis ta Lune », etc.) alors que l’étiquette indique déjà qui parle.
 */

import { splitJournalGuildRoleLine } from '@/lib/journal-chat-parse'

const PLANET_WORD =
  'lune|soleil|mercure|vénus|venus|mars|jupiter|saturne|uranus|neptune|pluton|ascendant|descendant|milieu du ciel|imum coeli|chiron|lilith|cérès|ceres|pallas|junon|juno|vesta|éris|eris|vertex|part de fortune'

/** « Je suis ta Lune, et je ressens… » → « Je ressens… » */
const RE_SELF_AS_PLANET = new RegExp(
  `^je\\s+suis\\s+(?:ta|ton|ton|ma|mon|l['']?)\\s*(?:${PLANET_WORD})\\s*[,;:\\s—–-]+(?:et\\s+)?(?:je\\s+)?`,
  'iu',
)

const RE_SELF_AS_ABSTRACT = /^je\s+suis\s+(?:la|le|les)\s+[\wàâçéèêëîïôûùüÿ'’\-\s]+\s*[,;:\s—–-]+(?:et\s+)?(?:je\s+)?/iu
const RE_EN_TANT_QUE = /^en\s+tant\s+que\s+[^,;:.]+[,;:\s—–-]+/iu
const RE_MOI_COMMA = /^moi,\s*[^,;:.]+[,;:\s—–-]+/iu

function capitalizeFirst(s: string): string {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Nettoie le corps d’une voix planète / point (pas Astrologie). */
export function cleanJournalGuildVoiceBody(body: string, roleLabel: string): string {
  const isAstrologie = /^astrologie\s*$/i.test(roleLabel.trim())
  if (isAstrologie || !body.trim()) return body

  let t = body.trim()

  const steps = [RE_SELF_AS_PLANET, RE_SELF_AS_ABSTRACT, RE_EN_TANT_QUE, RE_MOI_COMMA]
  for (const re of steps) {
    t = t.replace(re, 'Je ')
  }

  t = t.replace(/^Je\s+Je\s+/u, 'Je ')
  t = t.replace(/\s{2,}/g, ' ').trim()

  if (!t) return body.trim()
  return capitalizeFirst(t)
}

/** Réécrit chaque ligne « Rôle: corps » avec corps nettoyé. */
export function sanitizeJournalGuildReply(reply: string): string {
  const lines = reply.split('\n')
  const out: string[] = []

  for (const line of lines) {
    const guild = splitJournalGuildRoleLine(line)
    if (!guild) {
      out.push(line)
      continue
    }
    const cleaned = cleanJournalGuildVoiceBody(guild.body, guild.role)
    if (!cleaned) {
      out.push(line)
      continue
    }
    const rolePart = guild.role.trim()
    out.push(`${rolePart}: ${cleaned}`)
  }

  return out.join('\n')
}

/** Détecte les auto-présentations restantes (pour passe de correction IA). */
export function detectJournalGuildVoiceStyleIssues(reply: string): string[] {
  const issues: string[] = []
  const n = reply.toLowerCase()

  if (/\bje suis (?:ta |ton |ton |ma |mon )?(?:lune|soleil|mercure|vénus|mars|jupiter|saturne)\b/i.test(reply)) {
    issues.push(
      'Interdit : « je suis ta Lune / ton Soleil… » — l’étiquette du rôle suffit ; commence par le vécu (ex. « Je ressens… », « Je t’invite… »).',
    )
  }
  if (/\bje suis (?:la |le )?(?:structure|force)\b/i.test(reply)) {
    issues.push('Interdit : « je suis la structure / la force… » — commence directement par l’action ou le ressenti.')
  }
  if (/\ben tant que (?:mercure|lune|soleil|mars|jupiter)\b/i.test(n)) {
    issues.push('Interdit : « en tant que [planète] » — pas d’auto-présentation.')
  }

  return issues
}
