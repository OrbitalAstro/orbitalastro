'use client'

interface LogoBackgroundProps {
  opacity?: number
  className?: string
}

/** ViewBox large pour orbites étendues + marge aux inclinaisons */
const VB = 560
const CX = VB / 2
const CY = VB / 2
/** Décalage du système orbital : 0 = soleil au centre géométrique du SVG (= centre viewport), aligné avec le titre via translate sur la page. */
const ORBIT_VERTICAL_NUDGE = 0

/** Chemin fermé = une ellipse horizontale centrée (repère local avant tilt du groupe). */
function ellipseOrbitPath(rx: number, ry: number): string {
  return `M ${CX + rx},${CY} A ${rx} ${ry} 0 1 0 ${CX - rx},${CY} A ${rx} ${ry} 0 1 0 ${CX + rx},${CY}`
}

type SolarOrbitProps = {
  rx: number
  ry: number
  /** Inclinaison du plan orbital (°), autour du soleil */
  tilt: number
  /** Durée d’un tour complet (s) — chaque orbite = sa propre « année » */
  periodSec: number
  counterClockwise?: boolean
  beginDelaySec?: number
  /** Phase initiale sur l'orbite (0..1) pour éviter des départs groupés */
  phaseOffset?: number
  ringGradientId: string
  strokeWidth?: number
  bodyFill: string
  bodyR?: number
  /** Filtre sur le trait (désactivé = couleurs opalescentes plus nettes) */
  ringFilter?: string
}

/**
 * Anneau fixe + satellite en animateMotion le long de l’ellipse
 * (comme autour du soleil, vitesses indépendantes).
 */
function SolarOrbit({
  rx,
  ry,
  tilt,
  periodSec,
  counterClockwise = false,
  beginDelaySec = 0,
  phaseOffset = 0,
  ringGradientId,
  strokeWidth = 1.3,
  bodyFill,
  bodyR = 3.2,
  ringFilter,
}: SolarOrbitProps) {
  const pathD = ellipseOrbitPath(rx, ry)
  const clampedPhase = Math.max(0, Math.min(1, phaseOffset))
  // begin négatif = l'orbite est déjà "en cours" au chargement (position de départ dispersée).
  const phaseBegin = clampedPhase > 0 ? `${-(periodSec * clampedPhase)}s` : undefined
  const beginValue = phaseBegin ?? (beginDelaySec > 0 ? `${beginDelaySec}s` : undefined)
  return (
    <g transform={`rotate(${tilt} ${CX} ${CY})`}>
      <ellipse
        cx={CX}
        cy={CY}
        rx={rx}
        ry={ry}
        fill="none"
        stroke={`url(#${ringGradientId})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={1}
        filter={ringFilter}
      />
      <g>
        <animateMotion
          dur={`${periodSec}s`}
          repeatCount="indefinite"
          path={pathD}
          begin={beginValue}
          keyPoints={counterClockwise ? '1;0' : '0;1'}
          keyTimes="0;1"
          calcMode="linear"
          rotate="0"
        />
        <g filter="url(#orbit-sat-glow)">
          {/* Anneau irisé = même axe 135° que le BrandText */}
          <circle
            r={bodyR + 0.38}
            fill="none"
            stroke="url(#sat-brand-rim)"
            strokeWidth={0.95}
            strokeOpacity={0.88}
          />
          <circle
            r={bodyR}
            fill={bodyFill}
            stroke="#ffffff"
            strokeWidth={1}
            strokeOpacity={0.95}
          />
          <circle r={Math.max(bodyR * 0.5, 1.85)} fill="#ffffff" fillOpacity={1} />
        </g>
      </g>
    </g>
  )
}

export default function LogoBackground({ opacity = 0.15, className = '' }: LogoBackgroundProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${className}`}
      style={{ opacity }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          viewBox={`0 0 ${VB} ${VB}`}
          preserveAspectRatio="xMidYMid meet"
          className="h-[min(100%,90vh)] w-[min(100%,90vh)] max-h-[90vh] max-w-full shrink-0"
          aria-hidden
        >
          <defs>
            {/*
              Dégradés en userSpaceOnUse : le trait de chaque ellipse « échantillonne » des couleurs différentes
              selon sa position / inclinaison → lignes visiblement corail / prune / turquoise (comme le BrandText).
            */}
            <linearGradient
              id="orbit-opal-a"
              gradientUnits="userSpaceOnUse"
              x1="40"
              y1="120"
              x2="520"
              y2="440"
            >
              <stop offset="0%" stopColor="#FF7F50" stopOpacity="0.95" />
              <stop offset="22%" stopColor="#DDA0DD" stopOpacity="0.98" />
              <stop offset="44%" stopColor="#AFEEEE" stopOpacity="0.98" />
              <stop offset="66%" stopColor="#B0E0E6" stopOpacity="0.96" />
              <stop offset="88%" stopColor="#E8B4D4" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#FF9A6E" stopOpacity="0.94" />
            </linearGradient>
            <linearGradient
              id="orbit-opal-b"
              gradientUnits="userSpaceOnUse"
              x1="520"
              y1="80"
              x2="60"
              y2="480"
            >
              <stop offset="0%" stopColor="#B0E0E6" stopOpacity="0.96" />
              <stop offset="25%" stopColor="#FF8F70" stopOpacity="0.94" />
              <stop offset="48%" stopColor="#DDA0DD" stopOpacity="0.98" />
              <stop offset="72%" stopColor="#9FE8E0" stopOpacity="0.97" />
              <stop offset="100%" stopColor="#C8B4F0" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient
              id="orbit-opal-c"
              gradientUnits="userSpaceOnUse"
              x1="280"
              y1="32"
              x2="280"
              y2="528"
            >
              <stop offset="0%" stopColor="#FFF5F0" stopOpacity="0.92" />
              <stop offset="18%" stopColor="#FF7F50" stopOpacity="0.93" />
              <stop offset="38%" stopColor="#E8C4F0" stopOpacity="0.97" />
              <stop offset="56%" stopColor="#AFEEEE" stopOpacity="0.98" />
              <stop offset="76%" stopColor="#B0E0E6" stopOpacity="0.96" />
              <stop offset="100%" stopColor="#DDA0DD" stopOpacity="0.94" />
            </linearGradient>
            <linearGradient
              id="orbit-opal-d"
              gradientUnits="userSpaceOnUse"
              x1="64"
              y1="280"
              x2="496"
              y2="280"
            >
              <stop offset="0%" stopColor="#AFEEEE" stopOpacity="0.97" />
              <stop offset="28%" stopColor="#DDA0DD" stopOpacity="0.98" />
              <stop offset="52%" stopColor="#FF9A6E" stopOpacity="0.94" />
              <stop offset="76%" stopColor="#B0E0E6" stopOpacity="0.96" />
              <stop offset="100%" stopColor="#E8B4E8" stopOpacity="0.95" />
            </linearGradient>

            {/* Même dégradé 135° que le texte — contour des planètes */}
            <linearGradient id="sat-brand-rim" x1="0%" y1="100%" x2="100%" y2="0%" gradientUnits="objectBoundingBox">
              <stop offset="0%" stopColor="#FF7F50" stopOpacity="0.95" />
              <stop offset="25%" stopColor="#DDA0DD" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#AFEEEE" stopOpacity="0.95" />
              <stop offset="75%" stopColor="#B0E0E6" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#FF7F50" stopOpacity="0.92" />
            </linearGradient>

            {/* Satellites : gros cœur blanc + pastels tirés des mêmes teintes que le logo textuel */}
            <radialGradient id="sat-opal-1" cx="30%" cy="26%" r="74%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="26%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="40%" stopColor="#ffe4dc" stopOpacity="0.99" />
              <stop offset="55%" stopColor="#f0d0f0" stopOpacity="0.97" />
              <stop offset="72%" stopColor="#c8f8f2" stopOpacity="0.95" />
              <stop offset="88%" stopColor="#d8e8ff" stopOpacity="0.93" />
              <stop offset="100%" stopColor="#ffd0c8" stopOpacity="0.9" />
            </radialGradient>
            <radialGradient id="sat-opal-2" cx="68%" cy="30%" r="72%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="24%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="42%" stopColor="#d8f8ff" stopOpacity="0.98" />
              <stop offset="58%" stopColor="#ecd8f8" stopOpacity="0.96" />
              <stop offset="78%" stopColor="#ffe8d8" stopOpacity="0.94" />
              <stop offset="100%" stopColor="#b8f0f0" stopOpacity="0.9" />
            </radialGradient>
            <radialGradient id="sat-opal-3" cx="40%" cy="72%" r="70%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="26%" stopColor="#fff8ff" stopOpacity="1" />
              <stop offset="44%" stopColor="#edd8ff" stopOpacity="0.97" />
              <stop offset="60%" stopColor="#c8fff4" stopOpacity="0.96" />
              <stop offset="82%" stopColor="#ffe0d0" stopOpacity="0.93" />
              <stop offset="100%" stopColor="#d0e8ff" stopOpacity="0.91" />
            </radialGradient>
            <radialGradient id="sat-opal-4" cx="56%" cy="24%" r="73%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="25%" stopColor="#f8fcff" stopOpacity="1" />
              <stop offset="42%" stopColor="#d0ecff" stopOpacity="0.98" />
              <stop offset="58%" stopColor="#f8dce8" stopOpacity="0.95" />
              <stop offset="80%" stopColor="#c8f8f8" stopOpacity="0.93" />
              <stop offset="100%" stopColor="#e8d8ff" stopOpacity="0.91" />
            </radialGradient>
            <radialGradient id="sat-opal-5" cx="26%" cy="54%" r="69%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="27%" stopColor="#f6fffe" stopOpacity="1" />
              <stop offset="44%" stopColor="#d8fff4" stopOpacity="0.97" />
              <stop offset="62%" stopColor="#f0dcff" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#dceeff" stopOpacity="0.92" />
            </radialGradient>

            {/* Halo modéré : renforce la lueur type texte (corail / prune / cyan) */}
            <filter
              id="orbit-sat-glow"
              x="-70%"
              y="-70%"
              width="240%"
              height="240%"
              colorInterpolationFilters="sRGB"
            >
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.12" result="blur" />
              <feColorMatrix
                in="blur"
                type="matrix"
                values="1.26 0 0 0 0.09  0 1.16 0 0 0.07  0 0 1.24 0 0.1  0 0 0 0.52 0"
                result="soft"
              />
              <feMerge>
                <feMergeNode in="soft" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g transform={`translate(0, ${ORBIT_VERTICAL_NUDGE})`}>
            {/* Orbites (pas de soleil SVG au centre : masqué par le « b » d’Orbital) */}
            <SolarOrbit
              rx={272}
              ry={174}
              tilt={-22}
              periodSec={198}
              counterClockwise
              beginDelaySec={0}
              phaseOffset={0.07}
              ringGradientId="orbit-opal-a"
              strokeWidth={1.45}
              bodyFill="url(#sat-opal-1)"
              bodyR={4.25}
            />
            <SolarOrbit
              rx={238}
              ry={152}
              tilt={31}
              periodSec={156}
              counterClockwise
              beginDelaySec={2}
              phaseOffset={0.29}
              ringGradientId="orbit-opal-b"
              strokeWidth={1.55}
              bodyFill="url(#sat-opal-2)"
              bodyR={4.4}
            />
            <SolarOrbit
              rx={210}
              ry={134}
              tilt={-14}
              periodSec={122}
              counterClockwise
              beginDelaySec={5}
              phaseOffset={0.53}
              ringGradientId="orbit-opal-c"
              strokeWidth={1.35}
              bodyFill="url(#sat-opal-3)"
              bodyR={3.95}
            />
            <SolarOrbit
              rx={198}
              ry={126}
              tilt={19}
              periodSec={104}
              counterClockwise
              beginDelaySec={1}
              phaseOffset={0.74}
              ringGradientId="orbit-opal-d"
              strokeWidth={1.5}
              bodyFill="url(#sat-opal-4)"
              bodyR={4.15}
            />
            <SolarOrbit
              rx={184}
              ry={118}
              tilt={-8}
              periodSec={84}
              counterClockwise
              beginDelaySec={8}
              phaseOffset={0.88}
              ringGradientId="orbit-opal-b"
              strokeWidth={1.25}
              bodyFill="url(#sat-opal-5)"
              bodyR={3.65}
            />
          </g>
        </svg>
      </div>
    </div>
  )
}
