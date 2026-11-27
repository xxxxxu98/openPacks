import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { RARITY_LABEL } from '../data/catalog'
import type { CardDef, Rarity } from '../types/game'
import { CardVisual } from './CardVisual'

const SHOCKS: Record<'SR' | 'SSR' | 'SECRET', number> = {
  SR: 4,
  SSR: 6,
  SECRET: 8,
}

type GradeSpectacleProps = {
  rarity: Extract<Rarity, 'SR' | 'SSR' | 'SECRET'>
  card: CardDef
  isNew: boolean
  x: number
  y: number
  onClose: () => void
}

/** 高等级翻开后霸屏：卡片飞到正中放大，特效停在蒙层上，点蒙层才收起。 */
export function GradeSpectacle({ rarity, card, isNew, x, y, onClose }: GradeSpectacleProps) {
  const rich = rarity !== 'SR'
  const secret = rarity === 'SECRET'
  const dismissRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  const style = { '--ox': `${x}px`, '--oy': `${y}px` } as CSSProperties

  /** 演出盖住页面时拦住底下的操作，并把焦点放在蒙层上。 */
  useEffect(() => {
    const ui = document.querySelector('.app-ui')
    ui?.setAttribute('inert', '')
    dismissRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      ui?.removeAttribute('inert')
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  return createPortal(
    <div className={`grade-show grade-show-${rarity}`} style={style} role="dialog" aria-modal="true" aria-labelledby="grade-word">
      <button ref={dismissRef} type="button" className="grade-dismiss" aria-label="关闭开卡演出" onClick={onClose} />
      <i className="grade-veil" aria-hidden />
      <i className="grade-lines" aria-hidden />
      <i className="grade-rays" aria-hidden />
      {rich ? <i className="grade-rays grade-rays-back" aria-hidden /> : null}
      <i className="grade-pillar" aria-hidden />
      <i className="grade-seal" aria-hidden />
      {secret ? <i className="grade-seal grade-seal-inner" aria-hidden /> : null}
      {Array.from({ length: SHOCKS[rarity] }, (_, index) => (
        <i
          key={index}
          className={index === 0 ? 'grade-shock is-fill' : 'grade-shock'}
          style={{ animationDelay: `${index * 0.11}s` }}
          aria-hidden
        />
      ))}
      {rich ? <i className="grade-slash" aria-hidden /> : null}
      {rich ? (
        <span className="grade-orbs" aria-hidden>
          <i />
          <i />
          <i />
          <i />
        </span>
      ) : null}
      <i className="grade-flash" aria-hidden />
      {secret ? <i className="grade-flash grade-flash-late" aria-hidden /> : null}
      {secret ? <i className="grade-chroma" aria-hidden /> : null}
      {secret ? (
        <svg className="grade-bolts" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          <polyline points="50,0 44,18 56,24 40,46 58,54 46,74 60,82 50,100" />
          <polyline points="18,0 26,20 12,30 28,52 16,60 30,82 22,90 32,100" />
          <polyline points="82,0 74,18 88,30 70,52 82,62 66,84 76,92 68,100" />
        </svg>
      ) : null}
      <i className="grade-bars" aria-hidden />
      <div className="grade-stage">
        <div className={`grade-banner grade-banner-${rarity}`}>
          <span className="grade-word" id="grade-word" data-text={RARITY_LABEL[rarity]}>
            {RARITY_LABEL[rarity]}
          </span>
          <small className="grade-card-name">{card.name}</small>
        </div>
        <div className="grade-hero">
          <CardVisual card={card} size="lg" still isNew={isNew} />
        </div>
      </div>
      <p className="grade-hint">点击蒙层继续</p>
    </div>,
    document.body,
  )
}
