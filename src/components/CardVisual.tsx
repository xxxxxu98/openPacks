import type { CSSProperties } from 'react'
import { RARITY_LABEL, formatSerial } from '../data/catalog'
import { usePointerTilt } from '../hooks/usePointerTilt'
import type { CardDef, MotifKind } from '../types/game'
import { Motif } from './Motif'

const ART_BG: Record<MotifKind, string> = {
  moth: 'radial-gradient(circle at 50% 42%, #9a3412 0%, #1c0a08 78%)',
  shell: 'radial-gradient(circle at 50% 42%, #0369a1 0%, #082f49 78%)',
  bell: 'radial-gradient(circle at 50% 40%, #0e7490 0%, #0c1a24 78%)',
  stag: 'radial-gradient(circle at 50% 40%, #334155 0%, #0f172a 78%)',
  fox: 'radial-gradient(circle at 50% 42%, #c2410c 0%, #1c0a06 78%)',
  knight: 'radial-gradient(circle at 50% 38%, #1e293b 0%, #020617 78%)',
  phoenix: 'radial-gradient(circle at 50% 42%, #be123c 0%, #1c0a08 78%)',
  owl: 'radial-gradient(circle at 50% 42%, #b45309 0%, #1c1408 78%)',
  lion: 'radial-gradient(circle at 50% 42%, #d97706 0%, #1c1408 78%)',
  eye: 'radial-gradient(circle at 50% 42%, #6d28d9 0%, #0c0618 78%)',
  wraith: 'radial-gradient(circle at 50% 42%, #581c87 0%, #09090b 78%)',
  crown: 'conic-gradient(from 40deg at 50% 50%, #ff0080, #ff8c00, #ffd700, #00e676, #00b0ff, #d500f9, #ff0080)',
}

type CardVisualProps = {
  card: CardDef
  size?: 'sm' | 'md' | 'lg'
  flippable?: boolean
  flipped?: boolean
  isNew?: boolean
  still?: boolean
  onFlip?: () => void
  onOpen?: () => void
}

/** 全息闪卡。拆卡从卡背翻开，图鉴直接看正面。 */
export function CardVisual({
  card,
  size = 'md',
  flippable = false,
  flipped = false,
  isNew = false,
  still = false,
  onFlip,
  onOpen,
}: CardVisualProps) {
  const tilt = usePointerTilt<HTMLDivElement>()
  const pose = tilt.pose
  const showFront = !flippable || flipped
  const spin = flippable ? (flipped ? 180 : 0) + pose.rotateY : pose.rotateY
  const rich = card.rarity === 'SSR' || card.rarity === 'SECRET'

  const face = (
    <div className={`card-face card-front${flippable ? '' : ' is-flat'}`}>
      <div className="card-art" style={{ background: ART_BG[card.motif] }}>
        {(card.rarity === 'SSR' || card.rarity === 'SECRET') && <div className="card-rays" />}
        <div className="card-art-top">
          {isNew ? <span className="new-tag">NEW</span> : <span />}
          <span className={`rarity-pill rarity-pill-${card.rarity}`}>{card.rarity}</span>
        </div>
        <div className="card-mascot">
          <Motif motif={card.motif} pupilX={pose.pupilX} pupilY={pose.pupilY} />
        </div>
        <div className="card-holo-overlay" />
        <div className="card-glare" />
      </div>
      <div className={`card-foot${rich ? ' is-dark' : ''}`}>
        <div className="card-foot-row">
          <h3>{card.name}</h3>
          <span>{RARITY_LABEL[card.rarity]}</span>
        </div>
        <p>{formatSerial(card)}</p>
      </div>
    </div>
  )

  return (
    <div className={`card-visual${still ? ' is-steady' : ''}`} data-size={size} data-rarity={card.rarity}>
      <div
        className={`tcg-card rarity-${card.rarity}${showFront && flippable ? ' is-flipped' : ''}${tilt.resting ? '' : ' is-tilting'}${flippable ? '' : ' is-shown'}`}
        ref={tilt.ref}
        style={
          {
            transform: `rotateX(${pose.rotateX}deg) rotateY(${spin}deg)`,
            '--mx': `${pose.glareX}%`,
            '--my': `${pose.glareY}%`,
          } as CSSProperties
        }
        onPointerMove={tilt.onPointerMove}
        onPointerLeave={tilt.onPointerLeave}
      >
        {flippable && (
          <button
            type="button"
            className="card-hit"
            aria-label={showFront ? `查看${card.name}详情` : '翻开闪卡'}
            onClick={() => {
              // 背面点击翻开，正面点开详情。
              if (!showFront) onFlip?.()
              else onOpen?.()
            }}
          />
        )}
        {(flippable || still) && (
          // 详情里转过去时露出这面卡背。
          <div className="card-face card-back">
            <div className="matte-grain-texture" />
            <div className="card-back-plate">
              <i />
              <i />
              <i />
              <i />
              <div className="card-back-seal">
                <BackMark />
              </div>
              <div className="card-back-word">
                <span className="gold-foil-text">PRISM</span>
                <span>01 · ARCHIVE</span>
              </div>
            </div>
            <div className="card-back-foil" />
          </div>
        )}
        {face}
      </div>
    </div>
  )
}

/** 卡背纹章：细环套住一枚四芒星。 */
function BackMark() {
  return (
    <svg viewBox="0 0 80 80" aria-hidden>
      <circle cx="40" cy="40" r="31" fill="none" stroke="currentColor" strokeWidth="0.7" />
      <circle cx="40" cy="40" r="25" fill="none" stroke="currentColor" strokeWidth="0.35" opacity="0.65" />
      <path d="M40 11 L47 33 L69 40 L47 47 L40 69 L33 47 L11 40 L33 33 Z" fill="none" stroke="currentColor" strokeWidth="1.15" />
      <path d="M40 24 C40 32 48 40 56 40 C48 40 40 48 40 56 C40 48 32 40 24 40 C32 40 40 32 40 24 Z" fill="currentColor" />
    </svg>
  )
}
