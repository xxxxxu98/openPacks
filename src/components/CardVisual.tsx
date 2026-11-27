import { useEffect, useState } from 'react'
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
/** 翻开后动效留存的时间，秘藏最长。 */
const REVEAL_HOLD: Record<Rarity, number> = {
  N: 480,
  R: 640,
  SR: 2100,
  SSR: 2700,
  SECRET: 3300,
}
const HIGH_GRADE: ReadonlySet<Rarity> = new Set(['SR', 'SSR', 'SECRET'])

type CardVisualProps = {
  card: CardDef
  size?: 'sm' | 'md' | 'lg'
  flippable?: boolean
  flipped?: boolean
  isNew?: boolean
  still?: boolean
  thick?: boolean
  sweep?: boolean
  onFlip?: () => void
  onOpen?: () => void
}

const BOARD_STEPS = 5
const BOARD_ANCHORS = [
  { name: 'tr', x: '100% - var(--card-radius)', y: 'var(--card-radius)', start: -90 },
  { name: 'br', x: '100% - var(--card-radius)', y: '100% - var(--card-radius)', start: 0 },
  { name: 'bl', x: 'var(--card-radius)', y: '100% - var(--card-radius)', start: 90 },
  { name: 'tl', x: 'var(--card-radius)', y: 'var(--card-radius)', start: 180 },
] as const

const BOARD_CORNERS = BOARD_ANCHORS.flatMap((anchor) =>
  Array.from({ length: BOARD_STEPS }, (_, index) => {
    const phi = anchor.start + ((index + 0.5) * 90) / BOARD_STEPS
    const rad = (phi * Math.PI) / 180
    return {
      key: `${anchor.name}-${index}`,
      left: `calc(${anchor.x} + ${Math.cos(rad).toFixed(4)} * var(--card-radius) - var(--corner-span) / 2)`,
      top: `calc(${anchor.y} + ${Math.sin(rad).toFixed(4)} * var(--card-radius) - var(--card-depth) / 2)`,
      turn: phi - 90,
    }
  }),
)

/** 给检视中的卡补上银行卡那样的薄边。 */
function CardBoard() {
  return (
    <div className="card-board" aria-hidden>
      <i className="card-edge edge-top" />
      <i className="card-edge edge-right" />
      <i className="card-edge edge-bottom" />
      <i className="card-edge edge-left" />
      {BOARD_CORNERS.map((piece) => (
        <i
          key={piece.key}
          className="card-corner"
          style={{
            left: piece.left,
            top: piece.top,
            transform: `rotateZ(${piece.turn}deg) rotateX(90deg)`,
          }}
        />
      ))}
    </div>
  )
}

/** 节气册页。正面写季节、墨画、三候和题款，背面是一枚岁印。 */
export function CardVisual({
  card,
  size = 'md',
  flippable = false,
  flipped = false,
  isNew = false,
  still = false,
  thick = false,
  sweep = false,
  onFlip,
  onOpen,
}: CardVisualProps) {
  const tilt = usePointerTilt<HTMLDivElement>()
  const pose = tilt.pose
  const showFront = !flippable || flipped
  const [revealing, setRevealing] = useState(false)

  /** 普通和稀有翻开后短挂光环。高等级的光交给霸屏。 */
  useEffect(() => {
    if (!flippable || !flipped || HIGH_GRADE.has(card.rarity)) return
    setRevealing(true)
    const timer = window.setTimeout(() => setRevealing(false), REVEAL_HOLD[card.rarity])
    return () => window.clearTimeout(timer)
  }, [flippable, flipped, card.rarity])
  const lift = card.rarity === 'SECRET' ? 1.85 : card.rarity === 'SSR' ? 1.55 : card.rarity === 'SR' ? 1.28 : card.rarity === 'R' ? 1.08 : 0.7
  const tiltX = still ? 0 : pose.rotateX * lift
  const tiltY = still ? 0 : pose.rotateY * lift
  const spin = flippable ? (flipped ? 180 : 0) + tiltY : tiltY
  const silk = card.rarity === 'SSR' || card.rarity === 'SECRET'
  const high = HIGH_GRADE.has(card.rarity)

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
      {/* 特级和秘藏才走扫光。 */}
      {sweep && silk ? <i className={`card-foil card-foil-${card.rarity}`} aria-hidden /> : null}
    </div>
  )

  return (
    <div
      className={`card-visual${still ? ' is-steady' : ''}${thick ? ' is-thick' : ''}`}
      data-size={size}
      data-rarity={card.rarity}
      data-season={card.season}
    >
      <div className={`card-stage${revealing ? ` is-revealing reveal-${card.rarity}` : ''}`}>
      {revealing && (
        <div className="reveal-aura" aria-hidden>
          <i className="reveal-pillar" />
          <i className="reveal-ring" />
          {card.rarity === 'R' ? <i className="reveal-ring echo" /> : null}
          {card.rarity === 'SECRET' ? <i className="reveal-ring alt" /> : null}
        </div>
      )}
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
        {thick && <CardBoard />}
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
      {revealing && high && <b className="reveal-stamp">{RARITY_LABEL[card.rarity]}</b>}
      {revealing && high && <i className="reveal-sheen" aria-hidden />}
      </div>
    </div>
  )
}
