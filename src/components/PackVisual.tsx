import type { CSSProperties, KeyboardEvent, PointerEvent } from 'react'
import { usePointerTilt } from '../hooks/usePointerTilt'
import type { Rarity } from '../types/game'
import { getOffer } from '../data/catalog'
import { PackCrest } from './Motif'

const PEEK: Partial<Record<Rarity, string>> = {
  N: 'active-N',
  R: 'active-R',
  SR: 'active-SR',
  SSR: 'active-UR',
  SECRET: 'active-SEC',
}

type PackVisualProps = {
  offerId: string
  size?: 'sm' | 'md' | 'lg'
  float?: boolean
  tear?: number
  shaking?: boolean
  spring?: boolean
  ripped?: boolean
  peek?: Rarity | null
  seal?: 'display' | 'live'
  onSealDown?: (event: PointerEvent<HTMLButtonElement>) => void
  onSealMove?: (event: PointerEvent<HTMLButtonElement>) => void
  onSealUp?: (event: PointerEvent<HTMLButtonElement>) => void
  onSealKey?: (delta: number) => void
}

/** 哑光黑压纹卡包。封口跟着撕开进度抬起，中间露出一条暗缝。 */
export function PackVisual({
  offerId,
  size = 'md',
  float = false,
  tear = 0,
  shaking = false,
  spring = false,
  ripped = false,
  peek = null,
  seal = 'display',
  onSealDown,
  onSealMove,
  onSealUp,
  onSealKey,
}: PackVisualProps) {
  const tilt = usePointerTilt<HTMLDivElement>()
  const pack = getOffer(offerId)
  const pose = tilt.pose
  const ratio = Math.max(0, Math.min(1, tear))
  const vars = {
    '--tear-tx': `${ratio * 20}px`,
    '--tear-ty': `${-ratio * 42}px`,
    '--tear-rot': `${ratio * 8}deg`,
    '--tear-skew': `${-ratio * 8}deg`,
    '--tear-stretch': `${1 + ratio * 0.08}`,
    '--body-skew': `${-ratio * 1.4}deg`,
    '--body-stretch': `${1 + ratio * 0.02}`,
    '--tear-open': `${ratio > 0 ? 8 + ratio * 16 : 0}px`,
    '--seam-opacity': `${Math.min(1, ratio * 2.4)}`,
    '--seam-pct': `${ratio * 100}%`,
    '--sheen-x': `${(pose.glareX - 50) * 0.35}%`,
    '--sheen-y': `${(pose.glareY - 50) * 0.25}%`,
  } as CSSProperties

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      onSealKey?.(0.12)
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      onSealKey?.(-0.12)
    }
  }

  const sealBody = (
    <>
      <span>◄ TEAR SEAL</span>
      <span>{seal === 'live' ? '划开封口 ►' : pack.code}</span>
      <i className="tear-progress-bar" />
    </>
  )

  return (
    <div className={`pack-visual${float ? ' is-float' : ''}`} data-size={size}>
      <div
        className={`foil-pack-wrapper pack-theme-${pack.theme}${tilt.resting ? '' : ' is-tilting'}${shaking ? ' is-shaking' : ''}`}
        ref={tilt.ref}
        onPointerMove={tilt.onPointerMove}
        onPointerLeave={tilt.onPointerLeave}
        style={
          {
            ...vars,
            transform: `rotateX(${pose.rotateX}deg) rotateY(${pose.rotateY}deg)`,
          } as CSSProperties
        }
      >
        <div className={`peek-aura${peek ? ` ${PEEK[peek]}` : ''}`} />
        <div className="tear-mouth" aria-hidden>
          <i />
        </div>
        <div className={`pack-top-cap${spring ? ' snapping-back' : ''}${ripped ? ' ripped' : ''}`}>
          <div className="cap-tear-lip" aria-hidden />
          <div className="pack-crimp-top" />
          <div className="pack-cap-surface">
            <div className="matte-grain-texture" />
            <div className="foil-sheen" />
            {seal === 'live' ? (
              <button
                type="button"
                className="tear-track"
                role="slider"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(ratio * 100)}
                aria-label="向右撕开封条"
                onPointerDown={onSealDown}
                onPointerMove={onSealMove}
                onPointerUp={onSealUp}
                onPointerCancel={onSealUp}
                onKeyDown={onKeyDown}
              >
                {sealBody}
              </button>
            ) : (
              <div className="tear-track" aria-hidden>
                {sealBody}
              </div>
            )}
          </div>
        </div>
        <div className="pack-body">
          <div className="matte-grain-texture" />
          <div className="foil-sheen" />
          <div className="pack-brand">
            <span className="gold-foil-text">{pack.code}</span>
            <span className="pack-badge">
              {pack.cardCount} CARDS
              <br />
              {pack.edition}
            </span>
          </div>
          <div className="pack-mascot">
            <PackCrest kind={pack.crest} pupilX={pose.pupilX} pupilY={pose.pupilY} />
          </div>
          <div className="pack-edition">
            <strong>{pack.seriesName}</strong>
            <span>OPTICAL FOIL</span>
          </div>
          <div className="pack-crimp-bottom" />
        </div>
      </div>
    </div>
  )
}
