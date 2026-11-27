import { useId, type ReactNode } from 'react'
import type { MotifKind } from '../types/game'

type Look = { px: number; py: number; uid: string }

/** 吉祥物的眼睛跟着指针走。 */
function Eyes({ px, py }: { px: number; py: number }) {
  const dx = px * 1.5
  const dy = py * 1.5
  return (
    <g>
      <ellipse cx="43" cy="52" rx="4.2" ry="5" fill="#0f172a" />
      <ellipse cx="57" cy="52" rx="4.2" ry="5" fill="#0f172a" />
      <circle cx={44.2 + dx} cy={50.4 + dy} r="1.7" fill="#ffffff" />
      <circle cx={58.2 + dx} cy={50.4 + dy} r="1.7" fill="#ffffff" />
      <path d="M47 57.5 Q50 60.5 53 57.5" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    </g>
  )
}

function Stage({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 100 100" className="mascot-svg" aria-hidden>
      {children}
    </svg>
  )
}

/** 卡包上的三枚纹章：行星、星环、四芒。 */
export function PackCrest({ kind, pupilX, pupilY }: { kind: 'planet' | 'torus' | 'plus'; pupilX: number; pupilY: number }) {
  const uid = useId().replace(/:/g, '')
  const eyes = <Eyes px={pupilX} py={pupilY} />
  if (kind === 'plus') {
    return (
      <Stage>
        <defs>
          <radialGradient id={`crest-plus-${uid}`} cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="45%" stopColor="#bae6fd" />
            <stop offset="78%" stopColor="#f5d0fe" />
            <stop offset="100%" stopColor="#818cf8" />
          </radialGradient>
        </defs>
        <path
          d="M50 10 C59 10 61 36 64 39 C67 42 90 41 90 50 C90 59 67 58 64 61 C61 64 59 90 50 90 C41 90 39 64 36 61 C33 58 10 59 10 50 C10 41 33 42 36 39 C39 36 41 10 50 10 Z"
          fill={`url(#crest-plus-${uid})`}
          stroke="rgba(255,255,255,0.7)"
          strokeWidth="1.5"
        />
        {eyes}
      </Stage>
    )
  }
  if (kind === 'torus') {
    return (
      <Stage>
        <defs>
          <linearGradient id={`crest-torus-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f472b6" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="30" fill={`url(#crest-torus-${uid})`} stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
        <circle cx="50" cy="50" r="14" fill="#ffffff" />
        <g transform="translate(50 50) scale(0.48) translate(-50 -52)">{eyes}</g>
      </Stage>
    )
  }
  return (
    <Stage>
      <defs>
        <radialGradient id={`crest-planet-${uid}`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#93c5fd" />
          <stop offset="55%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1e1b4b" />
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="52" rx="38" ry="11" transform="rotate(-14 50 52)" fill="none" stroke="#fde68a" strokeWidth="5" opacity="0.85" />
      <circle cx="50" cy="50" r="24" fill={`url(#crest-planet-${uid})`} />
      <path d="M14 56 A38 11 -14 0 0 86 48" fill="none" stroke="#fef08a" strokeWidth="5" strokeLinecap="round" />
      {eyes}
    </Stage>
  )
}

const ART: Record<MotifKind, (look: Look) => React.ReactNode> = {
  moth: ({ px, py, uid }) => (
    <Stage>
      <defs>
        <radialGradient id={`wing-l-${uid}`} cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fdba74" />
          <stop offset="100%" stopColor="#c2410c" />
        </radialGradient>
        <radialGradient id={`wing-r-${uid}`} cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#d97706" />
        </radialGradient>
      </defs>
      <ellipse cx="28" cy="54" rx="20" ry="28" fill={`url(#wing-l-${uid})`} transform="rotate(-18 28 54)" />
      <ellipse cx="72" cy="54" rx="20" ry="28" fill={`url(#wing-r-${uid})`} transform="rotate(18 72 54)" />
      <ellipse cx="50" cy="56" rx="9" ry="20" fill="#1c1917" />
      <Eyes px={px} py={py} />
    </Stage>
  ),
  shell: ({ px, py, uid }) => (
    <Stage>
      <defs>
        <linearGradient id={`shell-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e0f2fe" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>
      <path
        d="M50 78 C78 78 86 48 64 36 C46 26 40 52 56 60 C68 66 70 46 56 42"
        fill="none"
        stroke={`url(#shell-${uid})`}
        strokeWidth="8"
        strokeLinecap="round"
      />
      <circle cx="56" cy="42" r="6" fill="#fff7ed" />
      <Eyes px={px} py={py} />
    </Stage>
  ),
  bell: ({ px, py, uid }) => (
    <Stage>
      <defs>
        <linearGradient id={`bell-${uid}`} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#7dd3fc" />
        </linearGradient>
      </defs>
      <path d="M50 16 C78 26 84 58 76 78 H24 C16 58 22 26 50 16 Z" fill={`url(#bell-${uid})`} stroke="#ffffff" strokeWidth="1.5" />
      <rect x="44" y="78" width="12" height="8" rx="2" fill="#fbbf24" />
      <circle cx="50" cy="90" r="5" fill="#fde68a" />
      <Eyes px={px} py={py} />
    </Stage>
  ),
  stag: ({ px, py }) => (
    <Stage>
      <path d="M34 38 C28 18 18 16 22 34 M30 30 C22 14 34 8 36 24" stroke="#e2e8f0" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M66 38 C72 18 82 16 78 34 M70 30 C78 14 66 8 64 24" stroke="#e2e8f0" strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="50" cy="58" rx="22" ry="24" fill="#94a3b8" />
      <ellipse cx="50" cy="66" rx="10" ry="8" fill="#e2e8f0" />
      <Eyes px={px} py={py} />
    </Stage>
  ),
  fox: ({ px, py, uid }) => (
    <Stage>
      <defs>
        <linearGradient id={`fox-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fdba74" />
          <stop offset="100%" stopColor="#c2410c" />
        </linearGradient>
      </defs>
      <path d="M22 28 L38 46 L28 70 L50 62 L72 70 L62 46 L78 28 L62 40 L50 22 Z" fill={`url(#fox-${uid})`} />
      <path d="M40 58 L50 78 L60 58" fill="#fff7ed" />
      <Eyes px={px} py={py} />
    </Stage>
  ),
  knight: ({ px, py }) => (
    <Stage>
      <path d="M28 40 H72 L78 70 C78 84 66 92 50 92 C34 92 22 84 22 70 Z" fill="#334155" stroke="#cbd5e1" strokeWidth="2" />
      <path d="M34 40 L50 18 L66 40" fill="#94a3b8" />
      <rect x="30" y="48" width="40" height="14" rx="4" fill="#0f172a" />
      <Eyes px={px} py={py} />
    </Stage>
  ),
  phoenix: ({ px, py, uid }) => (
    <Stage>
      <defs>
        <linearGradient id={`phoenix-${uid}`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset="50%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#fde68a" />
        </linearGradient>
      </defs>
      <path d="M18 70 C28 40 40 28 50 22 C60 28 72 40 82 70 C68 60 60 64 50 58 C40 64 32 60 18 70 Z" fill={`url(#phoenix-${uid})`} />
      <path d="M50 58 C46 78 42 88 50 92 C58 88 54 78 50 58 Z" fill="#fde68a" />
      <Eyes px={px} py={py} />
    </Stage>
  ),
  owl: ({ px, py }) => (
    <Stage>
      <path d="M32 28 L42 42 L28 40 Z" fill="#fbbf24" />
      <path d="M68 28 L58 42 L72 40 Z" fill="#f59e0b" />
      <ellipse cx="50" cy="58" rx="26" ry="28" fill="#fbbf24" />
      <ellipse cx="50" cy="66" rx="10" ry="8" fill="#fef3c7" />
      <path d="M50 64 L46 70 L54 70 Z" fill="#92400e" />
      <Eyes px={px} py={py} />
    </Stage>
  ),
  lion: ({ px, py, uid }) => (
    <Stage>
      <defs>
        <radialGradient id={`mane-${uid}`} cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="55%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="52" r="34" fill={`url(#mane-${uid})`} />
      <circle cx="50" cy="54" r="18" fill="#fef3c7" />
      <Eyes px={px} py={py} />
    </Stage>
  ),
  eye: ({ px, py, uid }) => (
    <Stage>
      <defs>
        <radialGradient id={`iris-${uid}`} cx="40%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#e9d5ff" />
          <stop offset="50%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#1e1b4b" />
        </radialGradient>
      </defs>
      <path d="M8 50 Q50 18 92 50 Q50 82 8 50 Z" fill="#f8fafc" stroke="#c4b5fd" strokeWidth="2" />
      <circle cx="50" cy="50" r="16" fill={`url(#iris-${uid})`} />
      <circle cx={50 + px * 3} cy={50 + py * 3} r="6" fill="#0f172a" />
      <circle cx={48 + px * 3} cy={48 + py * 3} r="2" fill="#ffffff" />
    </Stage>
  ),
  wraith: ({ px, py, uid }) => (
    <Stage>
      <defs>
        <linearGradient id={`wraith-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e9d5ff" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
      </defs>
      <path d="M28 46 C28 24 72 24 72 46 L76 84 L64 74 L54 86 L50 72 L40 86 L32 74 L24 84 Z" fill={`url(#wraith-${uid})`} />
      <Eyes px={px} py={py} />
    </Stage>
  ),
  crown: ({ px, py, uid }) => (
    <Stage>
      <defs>
        <linearGradient id={`crown-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="50%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>
      <path d="M16 62 L26 28 L40 48 L50 18 L60 48 L74 28 L84 62 Z" fill={`url(#crown-${uid})`} stroke="#fff7ed" strokeWidth="1.5" />
      <rect x="18" y="62" width="64" height="12" rx="3" fill="#f59e0b" />
      <circle cx="50" cy="42" r="5" fill="#67e8f9" />
      <g transform="translate(0 16)">{<Eyes px={px} py={py} />}</g>
    </Stage>
  ),
}

/** 十二张闪卡的吉祥物，造型跟演示里的全息纹章同一套光泽。 */
export function Motif({ motif, pupilX, pupilY }: { motif: MotifKind; pupilX: number; pupilY: number }) {
  const uid = useId().replace(/:/g, '')
  return ART[motif]({ px: pupilX, py: pupilY, uid })
}
