import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { RARITY_LABEL } from '../data/catalog'
import { GRADE_HIT_MS, GRADE_HIT_SEC } from '../gradeHit'
import { useCardPose } from '../hooks/useCardPose'
import type { CardDef, Rarity } from '../types/game'
import { CardVisual } from './CardVisual'

const SHOCKS: Record<'SR' | 'SSR' | 'SECRET', number> = {
  SR: 4,
  SSR: 6,
  SECRET: 8,
}
const LEAVE_MS = 180

type GradeSpectacleProps = {
  rarity: Extract<Rarity, 'SR' | 'SSR' | 'SECRET'>
  card: CardDef
  isNew: boolean
  x: number
  y: number
  onClose: () => void
}

/** 高等级翻开后霸屏。卡上拖拽旋转、滚轮缩放，点蒙层才收起。 */
export function GradeSpectacle({ rarity, card, isNew, x, y, onClose }: GradeSpectacleProps) {
  const rich = rarity !== 'SR'
  const secret = rarity === 'SECRET'
  const dismissRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef(onClose)
  const armedRef = useRef(false)
  const leavingRef = useRef(false)
  const pose = useCardPose()
  const [leaving, setLeaving] = useState(false)
  const leaveTimer = useRef(0)
  closeRef.current = onClose
  const timing = { '--hit': `${GRADE_HIT_SEC}s` } as CSSProperties
  const motion = { ...timing, '--ox': `${x}px`, '--oy': `${y}px` } as CSSProperties

  /** 落地之后才收起，先淡出再把页面交回去。 */
  const requestClose = () => {
    if (!armedRef.current || leavingRef.current) return
    leavingRef.current = true
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      closeRef.current()
      return
    }
    setLeaving(true)
    leaveTimer.current = window.setTimeout(() => closeRef.current(), LEAVE_MS)
  }
  const closeAction = useRef(requestClose)
  closeAction.current = requestClose

  /** 演出盖住页面时拦住底下的操作，落地后才允许点蒙层关掉。 */
  useEffect(() => {
    const ui = document.querySelector('.app-ui')
    ui?.setAttribute('inert', '')
    dismissRef.current?.focus()
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const armTimer = window.setTimeout(() => {
      armedRef.current = true
    }, reduce ? 0 : GRADE_HIT_MS)
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeAction.current()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(armTimer)
      window.clearTimeout(leaveTimer.current)
      ui?.removeAttribute('inert')
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  /** 特级和秘藏停住之后，隔一阵从卡边飘出余烬。 */
  useEffect(() => {
    if (rarity === 'SR') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let interval = 0
    const start = window.setTimeout(() => {
      const emit = () => {
        window.dispatchEvent(new CustomEvent('grade-ember', { detail: { rarity } }))
      }
      emit()
      interval = window.setInterval(emit, rarity === 'SECRET' ? 2100 : 2800)
    }, GRADE_HIT_MS + 1600)
    return () => {
      window.clearTimeout(start)
      window.clearInterval(interval)
    }
  }, [rarity])

  const showClass = `grade-show grade-show-${rarity}${leaving ? ' is-leaving' : ''}`
  const frontClass = `grade-front${leaving ? ' is-leaving' : ''}`

  return (
    <>
      {createPortal(
        <div className={showClass} style={timing} aria-hidden>
          <i className="grade-veil" />
          <i className="grade-lines" />
          <i className="grade-rays" />
          {rich ? <i className="grade-rays grade-rays-back" /> : null}
          <i className="grade-pillar" />
          <i className="grade-seal" />
          {secret ? <i className="grade-seal grade-seal-inner" /> : null}
          {Array.from({ length: SHOCKS[rarity] }, (_, index) => (
            <i
              key={index}
              className={index === 0 ? 'grade-shock is-fill' : 'grade-shock'}
              style={{ animationDelay: `calc(var(--hit) + ${index * 0.11}s)` }}
            />
          ))}
          {rich ? <i className="grade-slash" /> : null}
          {rich ? (
            <span className="grade-orbs">
              <i />
              <i />
              <i />
              <i />
            </span>
          ) : null}
          <i className="grade-flash" />
          {secret ? <i className="grade-flash grade-flash-late" /> : null}
          {secret ? <i className="grade-chroma" /> : null}
          {secret ? (
            <svg className="grade-bolts" viewBox="0 0 100 100" preserveAspectRatio="none">
              <polyline points="50,0 44,18 56,24 40,46 58,54 46,74 60,82 50,100" />
              <polyline points="18,0 26,20 12,30 28,52 16,60 30,82 22,90 32,100" />
              <polyline points="82,0 74,18 88,30 70,52 82,62 66,84 76,92 68,100" />
            </svg>
          ) : null}
          <i className="grade-bars" />
        </div>,
        document.body,
      )}
      {createPortal(
        <div
          className={frontClass}
          style={motion}
          role="dialog"
          aria-modal="true"
          aria-labelledby="grade-word"
        >
          <button
            ref={dismissRef}
            type="button"
            className="grade-dismiss"
            aria-label="关闭开卡演出"
            onClick={requestClose}
          />
          <div className="grade-stage">
            <div className={`grade-banner grade-banner-${rarity}`}>
              <span className="grade-word" id="grade-word" data-text={RARITY_LABEL[rarity]}>
                {RARITY_LABEL[rarity]}
              </span>
              <small className="grade-card-name">{card.name}</small>
            </div>
            <div className={`grade-hero grade-hero-${rarity}`}>
              <div
                ref={pose.ref}
                className={`grade-pose${pose.dragging ? ' is-dragging' : ''}`}
                style={{ transform: pose.transform }}
                onPointerDown={pose.onPointerDown}
                onPointerMove={pose.onPointerMove}
                onPointerUp={pose.onPointerUp}
                onPointerCancel={pose.onPointerUp}
                onDragStart={(event) => event.preventDefault()}
              >
                <div className="grade-hero-glow">
                  <CardVisual card={card} size="lg" still sweep isNew={isNew} />
                </div>
              </div>
            </div>
          </div>
          <p className="grade-hint">点击蒙层继续</p>
        </div>,
        document.body,
      )}
    </>
  )
}
