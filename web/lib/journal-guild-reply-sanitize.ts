/**
 * Nettoyage des réponses guilde (Journal pilote) : auto-présentations interdites
 * (« je suis ta Lune », etc.) alors que l’étiquette indique déjà qui parle.
 */

import { aerateJournalGuildBody } from '@/lib/journal-guild-aeration'
import {
  detectJournalGuildBannedOpenings,
  stripJournalGuildBannedOpenings,
} from '@/lib/journal-guild-banned-openings'
import { parseJournalGuildReply, splitJournalGuildRoleLine } from '@/lib/journal-chat-parse'

const PLANET_WORD =
  'lune|soleil|mercure|vénus|venus|mars|jupiter|saturne|uranus|neptune|pluton|ascendant|descendant|milieu du ciel|imum coeli|chiron|lilith|cérès|ceres|pallas|junon|juno|vesta|éris|eris|vertex|part de fortune'

const PLACEMENT_IN_LABEL = /\(\s*Natal:\s*[\s\S]+?\s*\+\s*Transit:\s*[\s\S]+?\)/i

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

/** Retire gras / italique markdown dans la prose (pas les étiquettes structurées). */
export function stripJournalGuildMarkdown(text: string): string {
  let t = text
  let prev = ''
  while (t !== prev) {
    prev = t
    t = t.replace(/\*\*([^*]+)\*\*/g, '$1')
    t = t.replace(/__(.+?)__/g, '$1')
    t = t.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '$1')
    t = t.replace(/(?<!_)_([^_\n]+)_(?!_)/g, '$1')
  }
  // Puces markdown en début de ligne (pas une ligne d’étiquette planète)
  t = t.replace(/^\s*\*\s+(?![^:\n]{0,160}\(Natal:)/gm, '')
  t = t.replace(/^\s*-\s+/gm, '')
  return t
}

/** Enlève les * autour du nom, garde le bloc (Natal: … + Transit: …). */
function precleanRolePrefix(line: string): string {
  const natalIdx = line.search(/\(\s*Natal:/i)
  if (natalIdx >= 0) {
    const prefix = line.slice(0, natalIdx).replace(/\*+/g, '').trim()
    const suffix = line
      .slice(natalIdx)
      .replace(/\*{1,2}\s*:/g, ':')
      .replace(/\)\s*\*{1,2}\s*:/g, '):')
    return `${prefix} ${suffix}`.replace(/\s{2,}/g, ' ').trim()
  }
  return line.replace(/^\*{1,2}\s*/, '').replace(/\*{1,2}\s*:/g, ':')
}

/** Retire le markdown d’une étiquette planète sans supprimer Natal / Transit. */
export function stripJournalGuildRoleLabel(role: string): string {
  const raw = role.trim()
  if (!raw) return raw
  if (/^astrologie$/i.test(raw.replace(/\*/g, '').trim())) return 'Astrologie'

  const placementMatch = raw.match(PLACEMENT_IN_LABEL)
  if (placementMatch) {
    const placement = placementMatch[0]
    const namePart = raw.slice(0, placementMatch.index ?? 0).replace(/^[\s*]+|[\s*]+$/g, '').trim()
    const name = stripJournalGuildMarkdown(namePart)
    const cleanPlacement = stripJournalGuildMarkdown(placement)
    if (name && /\(Natal:/i.test(cleanPlacement) && /Transit:/i.test(cleanPlacement)) {
      return `${name} ${cleanPlacement}`.trim()
    }
  }

  return stripJournalGuildMarkdown(raw)
}

/** Déballe le markdown sur une ligne d’étiquette pour que le parseur guilde la reconnaisse. */
export function precleanJournalGuildRoleLine(line: string): string {
  let trial = precleanRolePrefix(line.trimStart())
  const guild = splitJournalGuildRoleLine(trial)
  if (guild) {
    const role = stripJournalGuildRoleLabel(guild.role)
    return guild.body ? `${role}: ${guild.body}` : `${role}:`
  }
  if (splitJournalGuildRoleLine(line)) return line
  return line
}

/** Nettoie le corps d’une voix planète / point (pas Astrologie). */
export function cleanJournalGuildVoiceBody(body: string, roleLabel: string): string {
  const isAstrologie = /^astrologie\s*$/i.test(roleLabel.trim())
  if (!body.trim()) return body

  let t = stripJournalGuildMarkdown(body.trim())
  if (isAstrologie) {
    t = stripJournalGuildBannedOpenings(t)
    return t || body.trim()
  }

  const steps = [RE_SELF_AS_PLANET, RE_SELF_AS_ABSTRACT, RE_EN_TANT_QUE, RE_MOI_COMMA]
  for (const re of steps) {
    t = t.replace(re, 'Je ')
  }

  t = t.replace(/^Je\s+Je\s+/u, 'Je ')
  t = t.replace(/\s{2,}/g, ' ').trim()

  if (!t) return body.trim()
  return capitalizeFirst(t)
}

/** Réécrit chaque bulle guilde avec corps nettoyé (voix + prose sans markdown). */
export function sanitizeJournalGuildReply(reply: string): string {
  const preprocessed = reply
    .split('\n')
    .map(precleanJournalGuildRoleLine)
    .join('\n')
  const bubbles = parseJournalGuildReply(preprocessed)
  if (bubbles.length === 0) return stripJournalGuildMarkdown(preprocessed)

  const rebuilt = bubbles
    .map((b) => {
      const role = stripJournalGuildRoleLabel(b.speaker)
      let body = cleanJournalGuildVoiceBody(b.body, role)
      body = aerateJournalGuildBody(body, role)
      return body ? `${role}: ${body}` : ''
    })
    .filter(Boolean)
    .join('\n\n')

  return rebuilt || stripJournalGuildMarkdown(preprocessed)
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
  const planetLines = reply.split('\n').filter((l) => splitJournalGuildRoleLine(l))
  const planetWithoutPlacement = planetLines.filter((l) => {
    const g = splitJournalGuildRoleLine(l)!
    if (/^astrologie\s*$/i.test(g.role.trim())) return false
    return !/\(Natal:/i.test(g.role) || !/Transit:/i.test(g.role)
  })
  if (planetWithoutPlacement.length > 0) {
    issues.push(
      'Chaque voix planète doit avoir une étiquette « Nom (Natal: signe, maison … + Transit: signe, maison …): » — données du bloc seulement.',
    )
  }
  if (/\ben tant que (?:mercure|lune|soleil|mars|jupiter)\b/i.test(n)) {
    issues.push('Interdit : « en tant que [planète] » — pas d’auto-présentation.')
  }
  if (/\*\*[^*]+\*\*/.test(reply)) {
    issues.push(
      'Interdit : gras markdown (**mot**) — prose simple sans astérisques ; nomme planètes et aspects en texte normal.',
    )
  }
  issues.push(...detectJournalGuildBannedOpenings(reply))

  return issues
}
