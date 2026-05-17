'use client'

import { useId } from 'react'
import { motion } from 'framer-motion'

/** ViewBox large pour orbites étendues + marge aux inclinaisons */
export const ORBITAL_ORBITS_VB = 560
const CX = ORBITAL_ORBITS_VB / 2
const CY = ORBITAL_ORBITS_VB / 2
const ORBIT_VERTICAL_NUDGE = 0

function pid(prefix: string, name: string) {
  return `${prefix}-${name}`
}

function ellipseOrbitPath(rx: number, ry: number): string {
  return `M ${CX + rx},${CY} A ${rx} ${ry} 0 1 0 ${CX - rx},${CY} A ${rx} ${ry} 0 1 0 ${CX + rx},${CY}`
}

type SolarOrbitProps = {
  rx: number
  ry: number
  tilt: number
  periodSec: number
  counterClockwise?: boolean
  beginDelaySec?: number
  phaseOffset?: number
  ringGradientId: string
  strokeWidth?: number
  bodyFill: string
  bodyR?: number
  ringFilter?: string
  glowFilterId: string
  brandRimId: string
}

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
  glowFilterId,
  brandRimId,
}: SolarOrbitProps) {
  const pathD = ellipseOrbitPath(rx, ry)
  const clampedPhase = Math.max(0, Math.min(1, phaseOffset))
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
        <g filter={`url(#${glowFilterId})`}>
          <circle
            r={bodyR + 0.38}
            fill="none"
            stroke={`url(#${brandRimId})`}
            strokeWidth={0.95}
            strokeOpacity={0.88}
          />
          <circle r={bodyR} fill={bodyFill} stroke="#ffffff" strokeWidth={1} strokeOpacity={0.95} />
          <circle r={Math.max(bodyR * 0.5, 1.85)} fill="#ffffff" fillOpacity={1} />
        </g>
      </g>
    </g>
  )
}

type OrbitalOrbitsGraphicProps = {
  idPrefix: string
  className?: string
}

/** SVG des orbites animées (même graphisme que la page d’accueil). */
export function OrbitalOrbitsGraphic({ idPrefix, className = '' }: OrbitalOrbitsGraphicProps) {
  const gA = pid(idPrefix, 'orbit-opal-a')
  const gB = pid(idPrefix, 'orbit-opal-b')
  const gC = pid(idPrefix, 'orbit-opal-c')
  const gD = pid(idPrefix, 'orbit-opal-d')
  const rim = pid(idPrefix, 'sat-brand-rim')
  const s1 = pid(idPrefix, 'sat-opal-1')
  const s2 = pid(idPrefix, 'sat-opal-2')
  const s3 = pid(idPrefix, 'sat-opal-3')
  const s4 = pid(idPrefix, 'sat-opal-4')
  const s5 = pid(idPrefix, 'sat-opal-5')
  const glow = pid(idPrefix, 'orbit-sat-glow')

  return (
    <svg
      viewBox={`0 0 ${ORBITAL_ORBITS_VB} ${ORBITAL_ORBITS_VB}`}
      preserveAspectRatio="xMidYMid meet"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id={gA} gradientUnits="userSpaceOnUse" x1="40" y1="120" x2="520" y2="440">
          <stop offset="0%" stopColor="#FF7F50" stopOpacity="0.95" />
          <stop offset="22%" stopColor="#DDA0DD" stopOpacity="0.98" />
          <stop offset="44%" stopColor="#AFEEEE" stopOpacity="0.98" />
          <stop offset="66%" stopColor="#B0E0E6" stopOpacity="0.96" />
          <stop offset="88%" stopColor="#E8B4D4" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#FF9A6E" stopOpacity="0.94" />
        </linearGradient>
        <linearGradient id={gB} gradientUnits="userSpaceOnUse" x1="520" y1="80" x2="60" y2="480">
          <stop offset="0%" stopColor="#B0E0E6" stopOpacity="0.96" />
          <stop offset="25%" stopColor="#FF8F70" stopOpacity="0.94" />
          <stop offset="48%" stopColor="#DDA0DD" stopOpacity="0.98" />
          <stop offset="72%" stopColor="#9FE8E0" stopOpacity="0.97" />
          <stop offset="100%" stopColor="#C8B4F0" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id={gC} gradientUnits="userSpaceOnUse" x1="280" y1="32" x2="280" y2="528">
          <stop offset="0%" stopColor="#FFF5F0" stopOpacity="0.92" />
          <stop offset="18%" stopColor="#FF7F50" stopOpacity="0.93" />
          <stop offset="38%" stopColor="#E8C4F0" stopOpacity="0.97" />
          <stop offset="56%" stopColor="#AFEEEE" stopOpacity="0.98" />
          <stop offset="76%" stopColor="#B0E0E6" stopOpacity="0.96" />
          <stop offset="100%" stopColor="#DDA0DD" stopOpacity="0.94" />
        </linearGradient>
        <linearGradient id={gD} gradientUnits="userSpaceOnUse" x1="64" y1="280" x2="496" y2="280">
          <stop offset="0%" stopColor="#AFEEEE" stopOpacity="0.97" />
          <stop offset="28%" stopColor="#DDA0DD" stopOpacity="0.98" />
          <stop offset="52%" stopColor="#FF9A6E" stopOpacity="0.94" />
          <stop offset="76%" stopColor="#B0E0E6" stopOpacity="0.96" />
          <stop offset="100%" stopColor="#E8B4E8" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id={rim} x1="0%" y1="100%" x2="100%" y2="0%" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#FF7F50" stopOpacity="0.95" />
          <stop offset="25%" stopColor="#DDA0DD" stopOpacity="0.95" />
          <stop offset="50%" stopColor="#AFEEEE" stopOpacity="0.95" />
          <stop offset="75%" stopColor="#B0E0E6" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#FF7F50" stopOpacity="0.92" />
        </linearGradient>
        <radialGradient id={s1} cx="30%" cy="26%" r="74%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="26%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="40%" stopColor="#ffe4dc" stopOpacity="0.99" />
          <stop offset="55%" stopColor="#f0d0f0" stopOpacity="0.97" />
          <stop offset="72%" stopColor="#c8f8f2" stopOpacity="0.95" />
          <stop offset="88%" stopColor="#d8e8ff" stopOpacity="0.93" />
          <stop offset="100%" stopColor="#ffd0c8" stopOpacity="0.9" />
        </radialGradient>
        <radialGradient id={s2} cx="68%" cy="30%" r="72%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="24%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="42%" stopColor="#d8f8ff" stopOpacity="0.98" />
          <stop offset="58%" stopColor="#ecd8f8" stopOpacity="0.96" />
          <stop offset="78%" stopColor="#ffe8d8" stopOpacity="0.94" />
          <stop offset="100%" stopColor="#b8f0f0" stopOpacity="0.9" />
        </radialGradient>
        <radialGradient id={s3} cx="40%" cy="72%" r="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="26%" stopColor="#fff8ff" stopOpacity="1" />
          <stop offset="44%" stopColor="#edd8ff" stopOpacity="0.97" />
          <stop offset="60%" stopColor="#c8fff4" stopOpacity="0.96" />
          <stop offset="82%" stopColor="#ffe0d0" stopOpacity="0.93" />
          <stop offset="100%" stopColor="#d0e8ff" stopOpacity="0.91" />
        </radialGradient>
        <radialGradient id={s4} cx="56%" cy="24%" r="73%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="25%" stopColor="#f8fcff" stopOpacity="1" />
          <stop offset="42%" stopColor="#d0ecff" stopOpacity="0.98" />
          <stop offset="58%" stopColor="#f8dce8" stopOpacity="0.95" />
          <stop offset="80%" stopColor="#c8f8f8" stopOpacity="0.93" />
          <stop offset="100%" stopColor="#e8d8ff" stopOpacity="0.91" />
        </radialGradient>
        <radialGradient id={s5} cx="26%" cy="54%" r="69%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="27%" stopColor="#f6fffe" stopOpacity="1" />
          <stop offset="44%" stopColor="#d8fff4" stopOpacity="0.97" />
          <stop offset="62%" stopColor="#f0dcff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#dceeff" stopOpacity="0.92" />
        </radialGradient>
        <filter
          id={glow}
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
        <SolarOrbit
          rx={272}
          ry={174}
          tilt={-22}
          periodSec={198}
          counterClockwise
          phaseOffset={0.07}
          ringGradientId={gA}
          strokeWidth={1.45}
          bodyFill={`url(#${s1})`}
          bodyR={4.25}
          glowFilterId={glow}
          brandRimId={rim}
        />
        <SolarOrbit
          rx={238}
          ry={152}
          tilt={31}
          periodSec={156}
          counterClockwise
          beginDelaySec={2}
          phaseOffset={0.29}
          ringGradientId={gB}
          strokeWidth={1.55}
          bodyFill={`url(#${s2})`}
          bodyR={4.4}
          glowFilterId={glow}
          brandRimId={rim}
        />
        <SolarOrbit
          rx={210}
          ry={134}
          tilt={-14}
          periodSec={122}
          counterClockwise
          beginDelaySec={5}
          phaseOffset={0.53}
          ringGradientId={gC}
          strokeWidth={1.35}
          bodyFill={`url(#${s3})`}
          bodyR={3.95}
          glowFilterId={glow}
          brandRimId={rim}
        />
        <SolarOrbit
          rx={198}
          ry={126}
          tilt={19}
          periodSec={104}
          counterClockwise
          beginDelaySec={1}
          phaseOffset={0.74}
          ringGradientId={gD}
          strokeWidth={1.5}
          bodyFill={`url(#${s4})`}
          bodyR={4.15}
          glowFilterId={glow}
          brandRimId={rim}
        />
        <SolarOrbit
          rx={184}
          ry={118}
          tilt={-8}
          periodSec={84}
          counterClockwise
          beginDelaySec={8}
          phaseOffset={0.88}
          ringGradientId={gB}
          strokeWidth={1.25}
          bodyFill={`url(#${s5})`}
          bodyR={3.65}
          glowFilterId={glow}
          brandRimId={rim}
        />
      </g>
    </svg>
  )
}

type OrbitalOrbitsSpinnerProps = {
  size?: number
  label?: string
  className?: string
  align?: 'left' | 'center'
}

/** Indicateur de chargement : orbites de la page d’accueil, format compact. */
export function OrbitalOrbitsSpinner({
  size = 112,
  label = 'La guilde tisse sa réponse…',
  className = '',
  align = 'center',
}: OrbitalOrbitsSpinnerProps) {
  const idPrefix = useId().replace(/:/g, '')
  const alignClass = align === 'left' ? 'items-start' : 'items-center'
  const textAlignClass = align === 'left' ? 'text-left' : 'text-center'
  return (
    <motion.div
      role="status"
      aria-live="polite"
      className={`flex flex-col gap-4 py-1 ${alignClass} ${className}`.trim()}
    >
      <motion.div
        className="shrink-0"
        style={{ width: size, height: size }}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
      >
        <OrbitalOrbitsGraphic idPrefix={idPrefix} className="h-full w-full" />
      </motion.div>
      {label ? (
        <p className={`text-base font-medium tracking-wide text-cosmic-gold/85 ${textAlignClass}`}>
          {label}
        </p>
      ) : null}
    </motion.div>
  )
}
