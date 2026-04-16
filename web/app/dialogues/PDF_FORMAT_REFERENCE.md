# Format PDF - Dialogue Pré-incarnation

## Format de référence approuvé

Ce document décrit le format PDF approuvé pour les dialogues pré-incarnation.

### Caractéristiques principales

#### Fond
- **Couleur de fond** : Blanc (#ffffff)
- **Cadre** : Bordure dorée de 2px autour de toute la page (#b8860b)
- **Padding** : 30px

#### En-tête
- **Lignes décoratives** : Deux lignes horizontales dorées en haut
  - Ligne 1 : #b8860b
  - Ligne 2 : #8b6914
- **Logo "Orbital"** :
  - Police : Great Vibes (script avec lettres attachées)
  - Taille : 34px
  - Couleur : #b8860b (doré foncé)
  - Letter spacing : 0.5
  - Fichier : `/fonts/GreatVibes-Regular.ttf` (dans `public/fonts/`)
- **Logo "ASTRO"** :
  - Police : Times-Roman
  - Taille : 16px
  - Couleur : #8b6914 (doré très foncé)
  - Letter spacing : 6
  - Text transform : uppercase
  - Font weight : bold
- **Sous-titre "DIALOGUE PRÉ-INCARNATION"** :
  - Police : Times-Roman
  - Taille : 9px
  - Couleur : #8b6914
  - Letter spacing : 4
  - Text transform : uppercase
  - Font weight : bold

#### Contenu
- **Couleur du texte** : #b8860b (doré foncé pour visibilité sur fond blanc)
- **Police paragraphes** : Helvetica, 12px
- **Police texte d'atterrissage** : Helvetica-Oblique, 12px, centré
- **Police note de bas de page** : Helvetica, 9px, #8b6914, centré

#### Pagination
- Position : Bas de page, centré
- Format : "pageNumber / totalPages"
- Police : Helvetica, 10px
- Couleur : #b8860b

#### Nettoyage automatique
- Suppression automatique des marqueurs Markdown (####, ###, ##, #) au début des paragraphes

#### Nom du fichier
- Format : `Dialogue-pre-incarnation-[prénom].pdf`
- Note : "Dialogue" avec D majuscule

### Fichiers concernés
- `web/app/dialogues/DialoguePdf.tsx` : Composant PDF
- `web/app/dialogues/page.tsx` : Gestion du téléchargement PDF
- `web/public/fonts/GreatVibes-Regular.ttf` : Police script

### Notes importantes
- La police Great Vibes est chargée automatiquement depuis le dossier public
- Fallback automatique vers Times-Italic si la police ne se charge pas
- Le format est optimisé pour la lisibilité sur fond blanc

