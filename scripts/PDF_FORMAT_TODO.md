# Corrections à apporter au format PDF du script batch

## Date : 2025-12-30

## Contexte
Le script `batch_generate_dialogues.py` génère des PDFs pour les dialogues pré-incarnation, mais il y a encore des différences avec le format exact de l'application web (`web/app/dialogues/DialoguePdf.tsx`).

## Format de référence
Le format exact est défini dans `web/app/dialogues/DialoguePdf.tsx` et doit être reproduit fidèlement.

## Différences identifiées (à corriger)

### En-tête
- [ ] Format exact de "Orbital" et "ASTRO" (alignement, espacement, position)
- [ ] Espacement entre les éléments de l'en-tête
- [ ] Taille et style exacts des lignes dorées

### Autres éléments
- [ ] Autres différences visuelles à documenter lors de la prochaine session

## Notes
- Le format web utilise `@react-pdf/renderer` avec des styles très précis
- Le script Python utilise `reportlab` qui doit reproduire ces styles
- Il faudra comparer visuellement les PDFs générés avec ceux de l'application web

## Fichiers à modifier
- `scripts/batch_generate_dialogues.py` - fonction `create_pdf()`




