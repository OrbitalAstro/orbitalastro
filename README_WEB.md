# OrbitalAstro - Complete Platform

## Overview

OrbitalAstro is a comprehensive astrological platform featuring:
- **Advanced API Backend**: Professional-grade astrological calculations
- **Full Web Application**: Beautiful, feature-rich web interface

## Features

### API Backend
- ✅ Natal chart calculations with 10 house systems
- ✅ Transits, progressions, and solar returns
- ✅ Birth-time rectification engine
- ✅ Aspect detection with pattern recognition
- ✅ Topocentric Moon parallax correction
- ✅ Expanded astro objects (Lilith, asteroids, Arabic Parts)
- ✅ Modular interpretation system
- ✅ SVG chart rendering
- ✅ Comprehensive test suite

### Web Application
- ✅ Beautiful dashboard with chart visualization
- ✅ Interactive natal chart calculator
- ✅ Transits timeline viewer
- ✅ Personalized interpretations
- ✅ Story generation
- ✅ Comprehensive settings panel
- ✅ Modern, responsive UI

## Quick Start

### Backend API

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Run the API server:
```bash
uvicorn main:app --reload
```

API will be available at `http://localhost:8000`

### Web Application

1. Navigate to web directory:
```bash
cd web
```

2. Install dependencies:
```bash
npm install
```

3. Set environment variable:
```bash
export NEXT_PUBLIC_API_URL=http://localhost:8000
```

4. Run development server:
```bash
npm run dev
```

Web app will be available at `http://localhost:3000`

## Project Structure

```
orbitalastro/
├── api/                 # FastAPI endpoints
│   ├── natal.py        # Natal chart endpoint
│   ├── transits.py     # Transits endpoint
│   ├── progressions.py # Progressions endpoint
│   ├── solar_returns.py # Solar returns endpoint
│   ├── rectification.py # Rectification endpoint
│   └── chart_svg.py    # SVG chart endpoint
├── astro/              # Core astrological calculations
│   ├── aspects.py      # Aspect detection
│   ├── houses_multi.py # Multi-house systems
│   ├── transits.py     # Transit calculations
│   ├── progressions.py  # Progression calculations
│   ├── solar_returns.py # Solar return calculations
│   ├── rectification.py # Rectification engine
│   ├── parallax.py     # Moon parallax correction
│   ├── objects_extra.py # Extra objects
│   ├── chart_svg.py    # SVG rendering
│   └── interp_*.py     # Interpretation modules
├── web/                # Next.js web application
│   ├── app/            # Next.js app directory
│   ├── components/     # React components
│   └── lib/            # Utilities and API client
├── tests/              # Test suite
└── scripts/            # Utility scripts
```

## API Endpoints

- `POST /natal` - Calculate natal chart
- `POST /api/transits` - Calculate transits
- `POST /api/progressions` - Calculate progressions
- `POST /api/solar-return` - Calculate solar return
- `POST /api/rectify-birth-time` - Rectify birth time
- `GET /api/chart-svg` - Generate SVG chart
- `GET /cities` - List supported cities
- `GET /metrics` - API metrics

## Web Pages

- `/` - Home page
- `/dashboard` - Main dashboard with chart calculator
- `/chart` - Chart visualization page
- `/stories` - Story generation page
- `/settings` - Settings panel

## Settings

The settings panel allows customization of:
- House system (10 options)
- Chart options (extra objects, parallax, aspects)
- Narrative tone and depth
- Focus areas
- Chart visualization style and size
- Default location

## Testing

Run the test suite:
```bash
pytest tests/
```

## Documentation

- API documentation available at `http://localhost:8000/docs` (Swagger UI)
- Web app documentation in `web/README.md`

## License

See LICENSE file for details.











