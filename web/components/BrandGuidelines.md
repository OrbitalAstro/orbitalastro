# OrbitalAstro Brand Identity Kit

## 🎨 Color Palette

### Primary Colors

| Name | Hex | Usage |
|------|-----|-------|
| Cosmic Gold | `#F6C94C` | Highlights, icons, callouts |
| Nebula Pink | `#E056FD` | Buttons, gradients, accents |
| Deep Space Purple | `#3D1F71` | Background gradients |
| Void Black | `#000000` | Primary background |
| Star Mist White | `#FFFFFF` | Text, glows |

### Secondary Colors

| Name | Hex | Usage |
|------|-----|-------|
| Aurora Teal | `#3EF4C5` | Secondary accents |
| Eclipse Red | `#C44747` | Warnings or emphasis |
| Soft Horizon Blue | `#8BA8FF` | Charts, UI lines |

### Usage in Code

```tsx
// Tailwind classes
className="bg-cosmic-gold text-cosmic-pink"
className="bg-gradient-to-r from-cosmic-gold via-cosmic-pink to-cosmic-purple"

// CSS variables
color: var(--cosmic-gold);
background: var(--nebula-pink);
```

## 🔤 Typography

### Headings
- **Font**: Space Grotesk
- **Style**: Bold, geometric, modern
- **Usage**: All headings (h1-h6)
- **Classes**: `font-heading`

### Body Text
- **Font**: Inter
- **Style**: Readable, clean, quiet
- **Usage**: All body text, paragraphs, descriptions
- **Classes**: `font-body` (default)

### Accent Titles
- **Font**: Cinzel
- **Style**: Elegant, mythic
- **Usage**: Special sections, quotes, taglines
- **Classes**: `font-accent`

## 🔱 Logo Set

### A) Symbol Logo (Astrological Orbital Mark)
- Circle representing the ecliptic
- Three nested arcs (ASC, MC, IC)
- Glowing central dot (the Sun/self)
- Diagonal slash (orbits intersecting narratives)

**Usage**: `<Logo variant="symbol" size="md" />`

### B) Wordmark Logo
- "OrbitalAstro" text only
- Space Grotesk font
- Gold→Purple gradient

**Usage**: `<Logo variant="wordmark" size="md" />`

### C) Horizontal Logo (Default)
- Symbol + Wordmark combined
- Used in navigation

**Usage**: `<Logo variant="horizontal" size="md" />`

### D) Compact Logo
- Symbol + Wordmark in one line
- Smaller spacing

**Usage**: `<Logo variant="compact" size="sm" />`

## 🌌 Iconography

### Rules
- Use **Lucide Icons** exclusively
- Always **thin-line, elegant** style
- **1-2px strokes**
- **Gold** (`#F6C94C`) for highlights
- **White** (`#FFFFFF`) for content
- **Pink/Purple gradients** for decorative hero sections
- **Never filled icons** — outline only

### Example
```tsx
import { Sparkles } from 'lucide-react'

<Sparkles className="h-6 w-6 text-cosmic-gold stroke-[1.5]" />
```

## ✨ Voice & Tone

### Brand Tone
- **Mythopoetic** — storytelling, narrative-driven
- **Astronomical** — precise, scientific foundation
- **Gentle, curious** — inviting exploration
- **Never mystical** — no metaphysical claims
- **Never dogmatic** — open to interpretation
- **Symbolic, not metaphysical** — archetypal, psychological
- **Cinematic but grounded** — visual, but realistic

### Taglines
- "Where astronomy meets story."
- "Your cosmic blueprint awaits."
- "Precision. Symbolism. Narrative."
- "Where ancient wisdom meets modern precision"

### Writing Guidelines
- Use active voice
- Be clear and precise
- Invite curiosity
- Avoid jargon unless necessary
- Use metaphors sparingly
- Ground everything in observable reality

## 🛸 Design Principles

### Space-First Layout
- Generous negative space
- Don't crowd elements
- Let content breathe
- Use whitespace as a design element

### Soft Gradients
- Purple → Pink → Gold
- Always subtle, never harsh
- Use for backgrounds, text, buttons
- Never pure colors — always gradients

### Glow Edges
- Subtle glows to evoke nebulae
- Use sparingly on important elements
- Gold glow for highlights
- Pink glow for accents
- Never overwhelming

### Orbital Motion
- Slow rotations (20s+)
- Hover float effects
- Gentle, organic movement
- Never jarring or fast

### Alive but Calm
- Everything feels "alive"
- But never overwhelming
- Subtle animations
- Respect user's attention

## 🎯 Component Patterns

### Buttons
```tsx
// Primary CTA
<button className="px-10 py-4 bg-gradient-to-r from-cosmic-pink via-cosmic-purple to-cosmic-pink text-white rounded-xl font-semibold shadow-nebula hover:shadow-glow transition">
  Action
</button>

// Secondary
<button className="px-10 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl font-semibold border border-white/20 hover:bg-white/20 transition">
  Action
</button>
```

### Cards
```tsx
<div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-cosmic-gold/30 transition">
  {/* Content */}
</div>
```

### Text Gradients
```tsx
<h1 className="text-cosmic-gradient">
  Your Cosmic Blueprint
</h1>
```

## 📐 Spacing System

- Use Tailwind's spacing scale
- Prefer larger spacing (p-8, p-12, gap-8)
- Section spacing: `py-32` or `py-40`
- Container max-width: `max-w-7xl`

## 🌟 Animation Guidelines

- **Duration**: 0.5s - 1s for interactions
- **Easing**: `ease-out` or `ease-in-out`
- **Orbital rotations**: 20s+ (slow, meditative)
- **Hover effects**: Scale 1.05, subtle glow
- **Scroll animations**: Fade in + slide up
- **Never**: Bounce, shake, or jarring effects














