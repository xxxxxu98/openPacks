import type { CSSProperties, KeyboardEvent, PointerEvent } from 'react'
import { usePointerTilt } from '../hooks/usePointerTilt'
import type { Rarity } from '../types/game'
import { getOffer } from '../data/catalog'
import { plateSrc } from './PlateArt'

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

/** 卡包外观。节气是纸封，其余套在箔封中间嵌一张封面。 */
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
  const paper = pack.seriesId === 'solar'
  const coverSrc = pack.cover ? plateSrc(pack.cover) : ''
  const pose = tilt.pose
  const ratio = Math.max(0, Math.min(1, tear))
  const vars = {
    '--tear-tx': `${paper ? 0 : ratio * 20}px`,
    '--tear-ty': `${paper ? 0 : -ratio * 42}px`,
    '--tear-rot': `${paper ? 0 : ratio * 8}deg`,
    '--tear-skew': `${paper ? 0 : -ratio * 8}deg`,
    '--tear-stretch': `${1 + ratio * 0.08}`,
    '--body-skew': `${paper ? 0 : -ratio * 1.4}deg`,
    '--body-stretch': `${paper ? 1 : 1 + ratio * 0.02}`,
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
      <span>封缄</span>
      <span>{seal === 'live' ? '向右划开' : pack.code}</span>
      <i className="tear-progress-bar" />
    </>
  )

  return (
    <div className={`pack-visual${float ? ' is-float' : ''}`} data-size={size}>
      <div
        className={`foil-pack-wrapper${paper ? ' is-paper' : ''} pack-theme-${pack.theme}${tilt.resting ? '' : ' is-tilting'}${shaking ? ' is-shaking' : ''}`}
        ref={tilt.ref}
        onPointerMove={tilt.onPointerMove}
        onPointerLeave={tilt.onPointerLeave}
        style={
          {
            ...vars,
            '--pack-accent': pack.accent,
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
            <span className="pack-badge">{pack.edition}</span>
          </div>
          {coverSrc ? (
            <div className="pack-window" aria-hidden>
              <img src={coverSrc} alt="" />
              <i className="pack-window-seal">岁</i>
            </div>
          ) : (
            <div className="pack-seal" aria-hidden>
              <span>岁</span>
            </div>
          )}
          <div className="pack-edition">
            <strong>{pack.seriesName}</strong>
            <span>
              {pack.cardCount} 张 · {pack.edition}
            </span>
          </div>
          <div className="pack-crimp-bottom" />
        </div>
      </div>
    </div>
  )
}
