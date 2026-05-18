/**
 * Style de dialogue journal pilote : entretien fluide, ancré dans le vécu.
 * Modèle « ancré » : grandes lignes (Astrologie) → chœur planètes → synthèse.
 */

import { journalGuildPlanetVoiceRangeLabel } from '@/lib/journal-guild-chorus'

export type JournalDialogueDepth = 'light' | 'anchored'

/** Message personnel riche (fil de vie détaillé) → réponse type lettre ancrée. */
export function detectJournalDialogueDepth(
  message: string,
  prior: Array<{ role: string; content: string }>,
): JournalDialogueDepth {
  const t = message.trim()
  if (!t) return 'light'

  const priorUserMsgs = prior.filter((m) => m.role === 'user')
  const priorUserText = priorUserMsgs.map((m) => String(m.content || '')).join(' ')

  const combinedLen = t.length + Math.min(priorUserText.length, 800)
  const lifeMarkers =
    /\b(amie|ami|projet|magasin|rituel|fils|fille|Isabelle|Geneviève|gratitude|déprim|anxi|loop|mantra|croyance|DIY|camping|pouponnière|invit)\b/i

  if (t.length >= 320 || combinedLen >= 520) return 'anchored'
  if (t.length >= 140 && lifeMarkers.test(t)) return 'anchored'
  if (t.length >= 80 && lifeMarkers.test(t) && priorUserMsgs.length >= 1) return 'anchored'

  return 'light'
}

/** Extrait les derniers messages utilisateur du fil pour ancrer la réponse. */
export function formatRecentUserTurnsForAnchoring(
  prior: Array<{ role: string; content: string }>,
  options?: { maxTurns?: number; maxCharsPerTurn?: number },
): string {
  const maxTurns = options?.maxTurns ?? 4
  const maxChars = options?.maxCharsPerTurn ?? 480
  const users = prior.filter((m) => m.role === 'user').slice(-maxTurns)
  if (users.length === 0) return ''

  return users
    .map((m, i) => {
      const raw = String(m.content || '').trim()
      const excerpt = raw.length > maxChars ? `${raw.slice(0, maxChars)}…` : raw
      return `${i + 1}. « ${excerpt} »`
    })
    .join('\n')
}

/** Priorité : intéressant et ancré (vécu + mémoire), pas « cours d’astro ». */
export function journalDialogueGroundingBlock(): string {
  return `
**ANCRAGE VÉCU (priorité absolue sur la technique)**
- Ce que la personne vit **l’emporte** sur la carte : projets, liens, fatigue, espoir, contradictions, ce qu’elle a **écrit** dans le fil ou ce qui figure en **mémoire du compte**.
- Ouvre **Astrologie** comme quelqu’un qui **lit un mouvement en elle** (« ce que je perçois surtout, c’est moins une carte qu’un mouvement en toi ») — **pas** comme un calculateur qui annonce le ciel en première phrase.
- Si le fil ou la mémoire montrent un **avant / maintenant** (ex. découragement puis petites ouvertures), nomme-le **avec douceur** et **sans forcer** la gratitude ou le positif toxique.
- Reprends **1 à 3 fils concrets** qu’elle a mentionnés (mots ou images **siens** en courte écho) — pas une liste inventée.
- L’astro **soutient** le vécu : une date, une phase, un cycle **en une phrase** intégrée au récit — **pas** un paragraphe d’aspects avant d’avoir parlé d’elle.
- **Interdit** : réponse qui pourrait s’adresser à n’importe qui ; jargon en rafale ; moraliser (« sois forte ») ; prêcher la gratitude.
- **Interdit (ouvertures)** : « je comprends que tu cherches… », « je perçois ton envie de saisir les énergies… », « c’est une excellente question » — **pas de préambule** qui reformule sa question ; 1re phrase = lecture ou vécu **concret**.
`
}

function journalDialogueArchitectureLight(): string {
  return `
**ARCHITECTURE (message court ou question technique)**

**1) Astrologie :** accroche courte si utile, puis **lecture astro structurée** (sections 1–3 : tensions, fond/maisons, ouvertures) avec **placements et aspects nommés** du bloc.
**2) ${journalGuildPlanetVoiceRangeLabel()} planètes :** \`Lune (Natal: … + Transit: …):\`, etc. — **1 phrase** chacune, **effet** distinct.
**3) Astrologie :** clôture **0 ou 1 phrase** (souvent aucune).
**Plafond** : Astrologie + chœur + clôture. Étiquettes \`(Natal: … + Transit: …)\` sur chaque planète.
`
}

function journalDialogueArchitectureAnchored(): string {
  return `
**ARCHITECTURE ANCRÉE (message riche — prioritaire)** — comme un entretien **profond** : d’abord **elle**, puis le ciel **éclaire**, puis les voies **nuancent**. Pas un cours.

**1) Astrologie : les grandes lignes** (bloc principal — **5 à 8 phrases max** ; tu peux utiliser des **tirets** pour reprendre **ses** fils concrets)
Enchaîne **dans cet ordre** (sans titres visibles) :
- **Accroche** : ce que tu **remarques** en lisant son message — souvent un **contraste** (lourdeur récente dans le fil/mémoire ↔ ce qu’elle raconte aujourd’hui ; isolement ↔ lien ; lutte ↔ douceur). Pas le ciel en première phrase.
- **Ses fils** : reprends **2 à 4 éléments concrets** tirés de **son** texte (noms, projets, rituels) — en **tirets** ou phrases courtes ; montre que tu as **lu**.
- **Approfondir** : choisis **un** fil (amitié ancienne, invitation, rituel, mantra, projet…) et dis **pourquoi** ça compte humainement (loyauté, présence vs utilité, calme avant résolution, etc.) — **sans** inventer de faits.
- **Lecture astro structurée** (dans la même bulle **Astrologie**, après l’ancrage vécu si besoin) : applique les sections **1. Tensions / 2. Fond & maisons / 3. Ouvertures** (voir consigne « LECTURE ASTROLOGIQUE ») — aspects nommés (ex. Saturne opposé Lune en Balance), maisons traduites, corps listés quand plusieurs en maison 12, etc.
- **Insight** : si elle nomme un shift (« je loop moins », mantra, confiance) — nomme ce que ça change **en elle** (sécurité avant preuve, relâchement, etc.).

**2) Chœur planètes : ${journalGuildPlanetVoiceRangeLabel()} voix**
- **Après** les grandes lignes — elles **n’recapitulent pas** les histoires déjà dites par **Astrologie**.
- Chaque planète : étiquette Natal+Transit, **1 phrase** en **je**, angle **différent**.
- **Interdit** : répéter les mêmes interprétations qu’**Astrologie** mot pour mot.

**3) Astrologie : impression globale (optionnel)**
- **0 ou 1 phrase** — souvent **aucune** clôture.

**Plafond** : Astrologie longue + **${journalGuildPlanetVoiceRangeLabel()}** planètes + clôture optionnelle.
`
}

/** Architecture « approfondir » — une voix, pas un chœur. */
export function journalDialogueArchitectureDeepen(citedRole?: string | null): string {
  const who = citedRole?.trim() || 'la voix citée'
  return `
**ARCHITECTURE APPROFONDIR (conversation)**
- La personne s’adressait à **${who}** : **${who}** répond **seule** (4–7 phrases) — **comme un échange en tête-à-tête**, pas une réunion de la guilde.
- **0 ou 1** courte réplique après (optionnelle) — **2 bulles maximum**.
- **Ne pas** appliquer l’architecture « Astrologie table + ${journalGuildPlanetVoiceRangeLabel()} planètes » de ce message.
- **Ne pas** ouvrir par une longue **Astrologie** si **${who}** est une planète.
`
}

/** Bloc système — architecture du fil. */
export function journalDialogueArchitectureSingle(): string {
  return `
**ARCHITECTURE AUTRE VOIX (1 intervenant)**
- **Une** planète ou point choisi dans le bloc — **pas** déjà le fil conducteur du tour précédent si tu peux éviter.
- **4 à 7 phrases** en **je**, étiquette Natal+Transit ; commentaire **autrement** (angle neuf).
- **Pas** d’Astrologie table 1–2–3 ; **pas** de chœur.
`
}

export function journalDialogueArchitectureBlock(
  depth: JournalDialogueDepth = 'light',
  options?: { deepen?: boolean; citedDeepenRole?: string | null; singleVoice?: boolean },
): string {
  if (options?.singleVoice) {
    return `
${journalDialogueArchitectureSingle()}
**Fluidité** : une voix, un fil — pas de catalogue d’aspects.
`
  }
  if (options?.deepen) {
    return `
${journalDialogueArchitectureDeepen(options.citedDeepenRole)}
**Fluidité** : reste dans le fil de **${options.citedDeepenRole?.trim() || 'la voix citée'}** ; pas de catalogue d’aspects.
`
  }
  const arch = depth === 'anchored' ? journalDialogueArchitectureAnchored() : journalDialogueArchitectureLight()
  return `
${journalDialogueGroundingBlock()}
${arch}
**Fluidité** : phrases qui respirent ; « je remarque », « ça me semble », « peut-être » ; humour léger si elle en donne l’ouverture. Faits astro **fidèles au bloc**, **liés** à son récit.
`
}

/** Rappel court injecté dans le prompt utilisateur (tour courant). */
export function journalDialogueUserHint(
  depth: JournalDialogueDepth = 'light',
  voiceBudget: 'chorus' | 'minimal' | 'deepen' | 'single' | 'concrete' = 'chorus',
): string {
  if (voiceBudget === 'concrete') {
    return `**Piste concrète** : **1 voix** citée — une action pour les prochains jours ; pas de double bulle.`
  }
  if (voiceBudget === 'single') {
    return `**Autre voix** : **1 planète** seule (4–7 phrases) — pas Astrologie longue, pas chœur.`
  }
  if (voiceBudget === 'deepen') {
    return `**Conversation** : **une** voix citée (4–7 phrases) ; **0 ou 1** nuance courte — **2 bulles max**. Pas chœur, pas table 1–2–3.`
  }
  const planets =
    voiceBudget === 'chorus'
      ? `**${journalGuildPlanetVoiceRangeLabel()} planètes**`
      : '**1 planète**'
  if (depth === 'anchored') {
    return `**Mode ANCRÉ** : **Astrologie** synthétique (5–8 phrases) ; puis ${planets} (**1 phrase** chacune) ; clôture rare.`
  }
  return voiceBudget === 'chorus'
    ? `**Chœur** : Astrologie courte ; ${planets} (**1 phrase** chacune) ; clôture rare.`
    : `**Message court / relance** : Astrologie brève ; 1 planète si besoin.`
}

export function journalDialogueDepthSystemNote(depth: JournalDialogueDepth): string {
  if (depth !== 'anchored') return ''
  return `
**PROFONDEUR ANCRÉE (ce tour)** : son message (et le fil) contiennent assez de matière — applique l’**architecture ancrée** : grandes lignes d’abord, planètes en **nuance**, synthèse finale. Vise l’intérêt d’un entretien qui **accroche** à sa vie, pas une réponse générique.
`
}

/** Bloc optionnel quand l’historique utilisateur est disponible. */
export function journalDialogueAnchoringFromThread(
  recentUserTurns: string,
  options?: { deepenFollowUp?: boolean; singleVoiceFollowUp?: boolean },
): string {
  if (!recentUserTurns.trim()) return ''
  const deepenNote = options?.deepenFollowUp
    ? '\n\n**Approfondir** : ne relance **pas** toute la guilde — continue la **voix** qu’elle vient de citer.'
    : options?.singleVoiceFollowUp
      ? '\n\n**Autre voix** : **1 planète** seule — pas de table Astrologie ni chœur.'
      : '\n\nAvant d’écrire : si le message courant ou ces lignes sont **riches**, applique l’**architecture ancrée** (contrastes, tirets de **ses** fils, approfondissement, pont astro, nuance planètes, impression globale).'
  return `
**Ce qu’elle a dit récemment dans le fil (à ancrer — ne pas ignorer)** :
${recentUserTurns}${deepenNote}
`
}
