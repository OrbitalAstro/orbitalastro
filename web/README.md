# OrbitalAstro Web Application

A beautiful, full-featured web application for advanced astrological calculations and interpretations. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

### Astrological Features

- **Natal Charts**: Calculate and visualize natal charts with 10 house systems
- **Transits**: Track planetary transits with visual calendar and timeline views
- **Progressions**: View secondary progressions (1 day = 1 year)
- **Solar Returns**: Calculate solar return charts
- **Birth-Time Rectification**: Advanced rectification using life events
- **Synastry Charts**: Compare two charts side-by-side
- **Aspect Grid**: Traditional aspect matrix view
- **BiWheel Views**: Side-by-side chart comparisons for synastry and progressions
- **Transit Calendar**: Visual calendar with transit indicators
- **Chart History**: Save and quickly access recent charts
- **Chart Export**: Export charts as PNG or generate shareable links

### UX Features

- **Toast Notifications**: Success/error/info/warning feedback system
- **Loading Skeletons**: Informative loading states for charts, interpretations, and transits
- **Error Boundaries**: Graceful error handling with recovery actions
- **Keyboard Shortcuts**: Cmd+K quick actions menu, Esc to close modals
- **Tooltips**: Accessible help system with astrological term definitions
- **Form Validation**: Real-time feedback with clear error messages and success indicators
- **Mobile Menu**: Touch-optimized hamburger menu with slide-out navigation
- **Accessibility**: WCAG 2.1 AA compliant with ARIA labels, keyboard navigation, and focus indicators

### Design

- **Cinematic Landing Page**: "NASA meets Studio Ghibli meets Library of Alexandria" aesthetic
- **Brand Identity**: Cosmic color palette, Space Grotesk typography, orbital animations
- **Responsive Design**: Mobile-first approach with touch-optimized interactions
- **Dark Theme**: Void black background with cosmic gradients

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- OrbitalAstro API server running (see main README)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local`:
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

## Tech Stack

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type safety throughout
- **Tailwind CSS**: Utility-first styling with custom cosmic theme
- **Framer Motion**: Smooth animations and transitions
- **React Query**: Server state management and caching
- **Zustand**: Client state management with persistence
- **Lucide Icons**: Beautiful icon library
- **html2canvas**: Chart export functionality
- **date-fns**: Date manipulation utilities

## Project Structure

```
web/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Cinematic landing page
│   ├── dashboard/         # Main dashboard
│   ├── chart/             # Chart detail view
│   ├── stories/           # Astrological stories
│   ├── dialogues/         # Pre-incarnation dialogues
│   ├── settings/          # Settings panel
│   ├── about/             # About page
│   ├── layout.tsx         # Root layout with providers
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ChartVisualization.tsx    # Chart SVG renderer
│   ├── InterpretationPanel.tsx   # Interpretation display
│   ├── TransitsTimeline.tsx      # Transit timeline
│   ├── SynastryChart.tsx         # Synastry comparison
│   ├── AspectGrid.tsx            # Aspect matrix
│   ├── TransitCalendar.tsx       # Calendar view
│   ├── BiWheel.tsx              # Side-by-side charts
│   ├── ChartHistory.tsx         # History panel
│   ├── Toast.tsx                # Toast notifications
│   ├── Skeleton.tsx              # Loading skeletons
│   ├── ErrorBoundary.tsx         # Error handling
│   ├── Tooltip.tsx               # Tooltip component
│   ├── QuickActions.tsx          # Cmd+K menu
│   ├── MobileMenu.tsx            # Mobile navigation
│   ├── FormField.tsx             # Form input with validation
│   └── Logo.tsx                  # Brand logo component
├── lib/                   # Utilities
│   ├── api.ts            # API client
│   ├── store.ts          # Zustand stores
│   ├── toast.ts          # Toast state management
│   ├── keyboard.ts       # Keyboard shortcuts
│   └── export.ts         # Chart export utilities
└── public/                # Static assets
```

## Key Components

### ChartVisualization
Renders SVG charts with export functionality. Supports export as PNG and shareable links.

### SynastryChart
Compare two natal charts side-by-side with synastry aspects highlighted.

### AspectGrid
Traditional aspect matrix showing all planetary aspects in a grid format.

### TransitCalendar
Visual calendar view showing upcoming transits with click-to-view details.

### ChartHistory
Persistent chart history with local storage, quick load functionality, and history management.

### QuickActions
Cmd+K command palette for quick navigation and actions throughout the app.

## Keyboard Shortcuts

- `Cmd+K` (Mac) / `Ctrl+K` (Windows/Linux): Open quick actions menu
- `Esc`: Close modals and menus
- `Tab`: Navigate through form fields
- `Enter`: Submit forms

## API Integration

The web app connects to the OrbitalAstro FastAPI backend. Configure the API URL in `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

All API calls are handled through `lib/api.ts` using React Query for caching and state management.

### API Endpoints

#### Natal Chart (`/natal`)
Calculate a complete natal chart with optional narrative generation.

**Request:**
```typescript
{
  birth_date: string          // ISO format: "YYYY-MM-DD"
  birth_time: string          // "HH:MM" or "HH:MM:SS"
  latitude?: number
  longitude?: number
  timezone?: string           // IANA timezone (e.g., "America/New_York")
  birth_city?: string         // Alternative to lat/long
  house_system?: string       // Default: "placidus"
  include_extra_objects?: boolean
  use_topocentric_moon?: boolean
  include_aspects?: boolean
  narrative?: {
    tone?: string             // "mythic" | "psychological" | "coaching" | "cinematic" | "soft_therapeutic"
    depth?: string            // "short" | "standard" | "comprehensive"
    focus?: string[]          // ["career", "relationships", "family", "spirituality", "creativity", "healing"]
  }
}
```

#### Transits (`/api/transits`)
Calculate planetary transits for a specific date with optional chart data and narrative.

**Request:**
```typescript
{
  natal_positions: Record<string, number>  // Natal planetary longitudes
  natal_asc?: number                       // Natal ascendant longitude
  natal_mc?: number                        // Natal midheaven longitude
  target_date: string                     // ISO format: "YYYY-MM-DD"
  latitude?: number                        // Optional: for transit chart calculation
  longitude?: number                       // Optional: for transit chart calculation
  house_system?: string                    // Default: "placidus"
  include_angles?: boolean                 // Default: true
  include_patterns?: boolean               // Default: false
  narrative?: NarrativeConfig             // Optional narrative generation
}
```

**Response includes:**
- `transits`: List of transit aspects
- `transits_to_angles`: Transits to ASC/MC/IC/DSC
- `planets`: Transit chart planetary positions (if lat/long provided)
- `ascendant`, `midheaven`, `houses`: Transit chart data (if lat/long provided)
- `patterns`: Aspect patterns (if `include_patterns: true`)
- `narrative_seed`: Generated prompt (tone/depth/focus applied) ready for LLM interpretation

#### Progressions (`/api/progressions`)
Calculate secondary progressions (1 day = 1 year).

**Request:**
```typescript
{
  birth_datetime: string      // ISO format: "YYYY-MM-DDTHH:MM:SS"
  progressed_date: string     // ISO format: "YYYY-MM-DD"
  latitude: number
  longitude: number
  house_system?: string        // Default: "placidus"
  include_aspects?: boolean   // Default: true
  include_patterns?: boolean  // Default: false
  narrative?: NarrativeConfig // Optional narrative generation
}
```

**Response includes:**
- `progressed_datetime_utc`: Progressed datetime
- `age_years`: Age at progressed date
- `planets`, `ascendant`, `midheaven`, `houses`: Progressed chart data
- `progressed_to_natal_aspects`: Aspects between progressed and natal positions
- `patterns`: Aspect patterns (if `include_patterns: true`)
- `narrative_seed`: Generated prompt (tone/depth/focus applied)

#### Solar Returns (`/api/solar-return`)
Calculate solar return chart for a specific year.

**Request:**
```typescript
{
  birth_date: string           // ISO format: "YYYY-MM-DD"
  natal_sun_longitude: number  // Natal Sun longitude in degrees
  target_year: number          // Year for solar return
  latitude: number
  longitude: number
  house_system?: string         // Default: "placidus"
  include_aspects?: boolean    // Default: true
  include_patterns?: boolean  // Default: false
  narrative?: NarrativeConfig // Optional narrative generation
}
```

**Response includes:**
- `return_datetime_utc`: Solar return datetime
- `planets`, `ascendant`, `midheaven`, `houses`: Return chart data
- `sun_exactness_deg`: How close Sun is to natal position
- `aspects`: Aspects within return chart
- `patterns`: Aspect patterns (if `include_patterns: true`)
- `narrative_seed`: Generated prompt (tone/depth/focus applied)

#### Rectification (`/api/rectify-birth-time`)
Rectify birth time using significant life events.

**Request:**
```typescript
{
  birth_date: string
  approx_time: string          // "HH:MM" or "HH:MM:SS"
  timezone: string
  latitude_deg: number
  longitude_deg: number
  time_window_hours: number    // Search window (±hours)
  events: Array<{
    type: string               // e.g., "marriage", "career_change"
    datetime_local: string     // ISO format
    weight: number            // 0.1-5.0
  }>
  top_n?: number               // Default: 3
  step_minutes?: number        // Default: 5
}
```

### Narrative Configuration

All endpoints that support narrative generation accept a `NarrativeConfig`:

```typescript
interface NarrativeConfig {
  tone?: string      // "mythic" | "psychological" | "coaching" | "cinematic" | "soft_therapeutic"
  depth?: string     // "short" | "standard" | "long" | "comprehensive"
  focus?: string[]   // ["career", "relationships", "family", "spirituality", "creativity", "healing"]
}
```

The `narrative_seed` in responses is a formatted prompt ready to be sent to an LLM (like Gemini) for interpretation generation.

### Chart Export Options

- **GET `/api/chart-svg`** – pass `natal_chart` and optional `aspects` as JSON strings along with query parameters:
  - `style` (`traditional` | `modern`, defaults to `traditional`)
  - `size` (pixel diameter, defaults to `600`)
- **POST `/api/chart-svg`** – send `{ natal_chart, aspects, config }` in the JSON body:
  - The `config` object can include `style`, `size`, and any custom options (e.g., `accentColor`, `strokeWidth`)
  - Responses come back as `image/svg+xml`; you can inline them on the client or download them for sharing

## State Management

- **Zustand**: Client state (settings, chart history)
- **React Query**: Server state (API responses, caching)
- **Local Storage**: Persistent settings and chart history

## Styling

The app uses Tailwind CSS with a custom cosmic theme:

- **Colors**: `cosmic-gold`, `cosmic-pink`, `cosmic-purple`, `aurora-teal`, `eclipse-red`, `horizon-blue`
- **Typography**: Space Grotesk (headings), Inter (body), Cinzel (accents)
- **Animations**: Framer Motion for smooth, orbital-style animations

## Accessibility

- ARIA labels on all interactive elements
- Keyboard navigation support
- Focus indicators with cosmic gold outline
- Screen reader announcements
- Semantic HTML structure
- Skip links for keyboard users

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Development

### Adding New Components

1. Create component in `components/`
2. Use TypeScript for type safety
3. Follow the brand guidelines for styling
4. Add ARIA labels for accessibility
5. Include loading and error states

### Adding New Pages

1. Create page in `app/[route]/page.tsx`
2. Add navigation link in `MobileMenu.tsx` and `QuickActions.tsx`
3. Update metadata in `layout.tsx` if needed

## Performance

- Code splitting with Next.js App Router
- Image optimization
- Lazy loading for heavy components
- React Query caching for API responses
- Local storage for chart history

## License

Copyright (C) 2025 OrbitalAstro. Licensed under **GNU AGPL-3.0** — see the repository root [`LICENSE`](../LICENSE) and [`NOTICE`](../NOTICE). Swiss Ephemeris attribution: [`LICENSES/SWISS_EPHEMERIS.txt`](../LICENSES/SWISS_EPHEMERIS.txt).
