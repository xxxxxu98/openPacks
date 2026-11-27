import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { RARITY_LABEL, RARITY_TONE, formatSerial } from '../data/catalog'
import { useCardPose } from '../hooks/useCardPose'
import { salvageCard, useGameState } from '../store/useGameStore'
import type { CardDef } from '../types/game'
import { CardVisual } from './CardVisual'

type CardInspectProps = {
  card: CardDef
  isNew?: boolean
  onClose: () => void
}

/** 放大检视一张卡。打开时略侧过来，能看见薄薄的卡边；可缩放、旋转，拖动改倾斜。 */
export function CardInspect({ card, isNew = false, onClose }: CardInspectProps) {
  const owned = useGameState().owned[card.id] ?? 0
  const closeRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)
  const pose = useCardPose({ tiltX: 14, tiltY: -32 })
  const [turn, setTurn] = useState(0)

  onCloseRef.current = onClose

  /** 把缩放、旋转和倾斜收回最初的正面。 */
  function resetView() {
    setTurn(0)
    pose.reset()
  }

  useEffect(() => {
    // 方向键旋转，加减号缩放，Esc 关闭。
    closeRef.current?.focus()
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        setTurn((value) => value - 90)
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        setTurn((value) => value + 90)
      }
      if (event.key === '-' || event.key === '_') pose.zoomBy(-0.2)
      if (event.key === '=' || event.key === '+') pose.zoomBy(0.2)
      if (event.key === '0') resetView()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  return createPortal(
    <div className="inspect" role="dialog" aria-modal="true" aria-label={`${card.name} 详情`}>
      <button type="button" className="inspect-backdrop" aria-label="关闭详情" tabIndex={-1} onClick={onClose} />
      <div className="inspect-panel">
        <button ref={closeRef} type="button" className="inspect-close" onClick={onClose}>
          ✕
        </button>
        <div className="inspect-view">
          <div
            ref={pose.ref}
            className={`inspect-stage${pose.dragging ? ' is-dragging' : ''}`}
            onPointerDown={pose.onPointerDown}
            onPointerMove={pose.onPointerMove}
            onPointerUp={pose.onPointerUp}
            onPointerCancel={pose.onPointerUp}
          >
            <div className="inspect-pose" style={{ transform: `${pose.transform} rotate(${turn}deg)` }}>
              <CardVisual card={card} size="lg" still thick sweep isNew={isNew} />
            </div>
          </div>
        </div>
        <div className="inspect-copy">
          <span className="rarity-pill" style={{ color: RARITY_TONE[card.rarity] }}>
            {card.rarity} · {RARITY_LABEL[card.rarity]}
          </span>
          <h2>{card.name}</h2>
          <p className="inspect-span">{card.span}</p>
          <ol className="inspect-hou">
            {card.phenology.map((line, index) => (
              <li key={line}>{['一候', '二候', '三候'][index]} {line}</li>
            ))}
          </ol>
          <p className="inspect-verse">{card.verse}</p>
          <p>{card.flavor}</p>
          <p>{formatSerial(card)}</p>
          <p>持有 {owned} 张</p>
          {isNew && <p>这张是新卡。</p>}
          {owned > 1 ? (
            <button type="button" className="btn btn-gold" onClick={() => salvageCard(card.id)}>
              分解 1 张重复
            </button>
          ) : (
            <p>没有重复卡可分解。</p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
