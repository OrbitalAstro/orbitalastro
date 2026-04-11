# OrbitalAstro

**Where astronomy meets storytelling.**

OrbitalAstro is a professional-grade astrological calculation platform that combines Swiss Ephemeris-grade astronomical precision with mythopoetic narrative generation. Compute natal charts, track transits, explore progressions, calculate solar returns, and hear the dialogue of your pre-incarnation—all with the precision of an observatory and the poetry of myth.

## Features

### Core Astrological Calculations

- **Natal Charts**: Compute accurate natal charts with 10 house systems
- **Transits Engine**: Track planetary transits with configurable aspects and orbs
- **Secondary Progressions**: 1 day = 1 year progression calculations
- **Solar Returns**: Find exact solar return moments and compute return charts
- **Birth-Time Rectification**: Advanced rectification using life events and transit/progression scoring
- **Topocentric Moon Parallax**: High-precision lunar positioning corrections

### Advanced Features

- **10 House Systems**: Placidus, Whole Sign, Equal, Koch, Porphyry, Regiomontanus, Campanus, Alcabitius, Meridian, Topocentric
- **Aspect Engine**: Conjunction, opposition, square, trine, sextile, quincunx with orbs and applying/separating flags
- **Aspect Patterns**: T-square, Grand Trine, Yod, Grand Cross detection
- **Expanded Objects**: Lilith (mean & true), Ceres, Pallas, Juno, Vesta, Eris, Part of Fortune, Vertex, Arabic Parts, Fixed Stars
- **Modular Interpretation Layer**: Personalized narratives with configurable tone, depth, and focus
- **SVG Chart Rendering**: Beautiful, customizable chart visualizations

### Web Application

- **Cinematic Landing Page**: "NASA meets Studio Ghibli meets Library of Alexandria" aesthetic
- **Dashboard**: Comprehensive astrological dashboard with real-time calculations
- **Chart Visualization**: Interactive SVG chart wheels
- **Transit Calendar**: Visual calendar view of upcoming transits
- **Aspect Grid**: Traditional aspect matrix view
- **Synastry Charts**: Compare two charts side-by-side
- **BiWheel Views**: Side-by-side chart comparisons
- **Chart History**: Save and quickly access recent charts
- **Chart Export**: Export charts as PNG or shareable links

### UX Enhancements

- **Toast Notifications**: Success/error/info/warning feedback system
- **Loading Skeletons**: Informative loading states
- **Error Boundaries**: Graceful error handling with recovery
- **Keyboard Shortcuts**: Cmd+K quick actions menu
- **Tooltips**: Accessible help system with astrological term definitions
- **Form Validation**: Real-time feedback with clear error messages
- **Mobile Menu**: Touch-optimized navigation
- **Accessibility**: WCAG 2.1 AA compliant with ARIA labels and keyboard navigation

## Installation

### Backend (API)

1. Create a virtualenv with Python 3.10+:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Precompute ephemeris data:
   ```bash
   python scripts/generate_ephemeris.py --start-year 1900 --end-year 2100 --frequency-hours 1
   ```

4. Run the API server:
   ```bash
   uvicorn main:app --reload
   ```

The API will be available at `http://localhost:8000`

### Frontend (Web App)

1. Navigate to the web directory:
   ```bash
   cd web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set environment variables (create `.env.local`):
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

The web app will be available at `http://localhost:3000`

## API Endpoints

### Core Endpoints

- `GET /`: Health check
- `GET /cities`: List supported cities
- `GET /metrics`: Telemetry snapshot
- `POST /natal`: Compute natal chart
- `POST /transits`: Calculate transits
- `POST /progressions`: Compute secondary progressions
- `POST /solar-return`: Find and compute solar return
- `POST /rectify-birth-time`: Birth-time rectification
- `GET /chart-svg`: Generate SVG chart visualization

### Request Examples

**Natal Chart:**
```json
{
  "birth_date": "1990-01-01",
  "birth_time": "12:00:00",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "timezone": "America/New_York",
  "house_system": "placidus",
  "include_extra_objects": true,
  "use_topocentric_moon": false,
  "include_aspects": true,
  "narrative": {
    "tone": "mythic",
    "depth": "comprehensive",
    "focus": ["sun", "moon", "ascendant"]
  }
}
```

**Transits:**
```json
{
  "natal_positions": {"sun": 280.5, "moon": 45.2, ...},
  "natal_asc": 120.0,
  "natal_mc": 210.0,
  "target_date": "2024-12-25T12:00:00Z",
  "include_angles": true
}
```

## Project Structure

```
orbitalastro/
├── api/                    # FastAPI endpoints
│   ├── natal.py           # Natal chart endpoint
│   ├── transits.py        # Transits endpoint
│   ├── progressions.py    # Progressions endpoint
│   ├── solar_returns.py   # Solar returns endpoint
│   ├── rectification.py   # Rectification endpoint
│   └── chart_svg.py       # SVG rendering endpoint
├── astro/                 # Astronomical calculations
│   ├── aspects.py         # Aspect detection engine
│   ├── houses_multi.py    # Multi-house system support
│   ├── objects_extra.py   # Extra astrological objects
│   ├── transits.py        # Transit calculations
│   ├── progressions.py   # Progression calculations
│   ├── solar_returns.py   # Solar return finder
│   ├── parallax.py        # Topocentric parallax
│   ├── rectification.py   # Birth-time rectification
│   └── chart_svg.py       # SVG chart generator
├── web/                   # Next.js web application
│   ├── app/               # Next.js app directory
│   ├── components/        # React components
│   └── lib/               # Utilities and API client
├── scripts/               # Utility scripts
│   └── generate_ephemeris.py  # Ephemeris precomputation
├── data/                  # Data files
│   ├── ephemeris/         # Precomputed ephemeris JSON files
│   └── resources/         # City database, etc.
└── tests/                 # Test suite
    ├── test_aspects.py
    ├── test_house_systems.py
    ├── test_transits_progressions.py
    └── test_parallax.py
```

## Testing

Run the comprehensive test suite:

```bash
python -m pytest tests/
```

Tests include:
- Golden master comparisons for planetary positions
- House system validation
- Aspect detection accuracy
- Transit and progression calculations
- Parallax corrections
- Narrative structure validation

## Brand Identity

OrbitalAstro uses a carefully crafted brand identity:

- **Colors**: Cosmic Gold (#F6C94C), Nebula Pink (#E056FD), Deep Space Purple (#3D1F71)
- **Typography**: Space Grotesk (headings), Inter (body), Cinzel (accents)
- **Voice**: Mythopoetic, astronomical, gentle, curious—never mystical or dogmatic
- **Design Principles**: Space-first layout, soft gradients, orbital motion, alive but calm

## Documentation

- [API Documentation](http://localhost:8000/docs) - Interactive Swagger UI
- [Brand Guidelines](web/components/BrandGuidelines.md) - Complete brand identity kit
- [Web App README](web/README.md) - Frontend documentation

## Observability

- **Telemetry**: Middleware tracks request counts, errors, latency, cache hits/misses
- **Metrics Endpoint**: `/metrics` exposes counters for monitoring
- **Error Handling**: Comprehensive error boundaries and graceful degradation

## License

Copyright (C) 2025 OrbitalAstro.

This program is licensed under the **GNU Affero General Public License v3.0** (AGPL-3.0). See [`LICENSE`](LICENSE) for the full text.

**Swiss Ephemeris:** Astrological calculations use [Swiss Ephemeris](https://www.astro.com/ftp/swisseph/) via `pyswisseph`. This project is distributed under AGPL-3.0 in accordance with the Swiss Ephemeris dual-license option. The Astrodienst copyright notice and conditions are in [`LICENSES/SWISS_EPHEMERIS.txt`](LICENSES/SWISS_EPHEMERIS.txt). Additional project notices: [`NOTICE`](NOTICE).

**AGPL reminder:** If you offer this software as a network service, you must comply with the AGPL (including making Corresponding Source available to users as described in the license). Secrets (API keys, Stripe, Supabase, Gemini, etc.) must remain in environment variables and must not be published in the repository.

If you prefer a commercial, closed-source deployment without these obligations, you must obtain a **Swiss Ephemeris Professional License** from Astrodienst instead of relying on the AGPL path.

## Acknowledgments

Built with precision and poetry. Where ancient wisdom meets modern precision.
