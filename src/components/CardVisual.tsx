import type { CSSProperties } from 'react'
import { RARITY_LABEL, formatSerial } from '../data/catalog'
import { SEASON_LABEL } from '../data/solarTerms'
import { usePointerTilt } from '../hooks/usePointerTilt'
import type { CardDef, Rarity } from '../types/game'
import { SolarScene } from './SolarScene'

const HOU = ['一候', '二候', '三候'] as const
const RANK: Record<Rarity, string> = {
  N: '普',
  R: '稀',
  SR: '超',
  SSR: '特',
  SECRET: '秘',
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

/** 节气册页。正面写季节、墨画、三候和题款，背面是一枚岁印。 */
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
  const lift = card.rarity === 'SECRET' ? 1.85 : card.rarity === 'SSR' ? 1.55 : card.rarity === 'SR' ? 1.28 : card.rarity === 'R' ? 1.08 : 0.7
  const tiltX = still ? 0 : pose.rotateX * lift
  const tiltY = still ? 0 : pose.rotateY * lift
  const spin = flippable ? (flipped ? 180 : 0) + tiltY : tiltY
  const silk = card.rarity === 'SSR' || card.rarity === 'SECRET'

  const face = (
    <div
      className={`card-face card-front is-leaf season-${card.season}${silk ? ' is-silk' : ''}${flippable ? '' : ' is-flat'}`}
    >
      <div className="leaf-rim" />
      <header className="leaf-head">
        <span className="leaf-season">
          <b>{SEASON_LABEL[card.season]}</b>
          <small>{card.span}</small>
        </span>
        <span className="leaf-meta">
          {isNew ? <em className="new-tag">新</em> : null}
          <span className="leaf-rank">{RANK[card.rarity]}</span>
        </span>
      </header>
      <h3 className="leaf-name">{card.name}</h3>
      <div className="leaf-plate">
        <SolarScene id={card.scene} />
      </div>
      <ol className="leaf-hou">
        {card.phenology.map((line, index) => (
          <li key={line}>
            <i>{HOU[index]}</i>
            {line}
          </li>
        ))}
      </ol>
      <p className="leaf-verse">
        <span>{card.verse}</span>
        <i className="leaf-seal" aria-hidden>
          {SEASON_LABEL[card.season]}
        </i>
      </p>
      <footer className="leaf-foot">
        <span>{formatSerial(card)}</span>
        <span className="leaf-grade">{RARITY_LABEL[card.rarity]}</span>
      </footer>
      <div className="card-glare" />
    </div>
  )

  return (
    <div className={`card-visual${still ? ' is-steady' : ''}`} data-size={size} data-rarity={card.rarity}>
      <div
        className={`tcg-card rarity-${card.rarity}${showFront && flippable ? ' is-flipped' : ''}${tilt.resting ? '' : ' is-tilting'}${flippable ? '' : ' is-shown'}`}
        ref={tilt.ref}
        style={
          {
            transform: `translateZ(${tilt.resting || still ? 0 : 18}px) rotateX(${tiltX}deg) rotateY(${spin}deg)`,
            '--mx': `${pose.glareX}%`,
            '--my': `${pose.glareY}%`,
            '--gx': pose.glareX,
            '--gy': pose.glareY,
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
          <div className="card-face card-back is-paper-back">
            <div className="leaf-back-seal" aria-hidden>
              岁
            </div>
            <div className="leaf-back-word">
              <span>节气</span>
              <span>二十四</span>
            </div>
          </div>
        )}
        {face}
      </div>
    </div>
  )
}
