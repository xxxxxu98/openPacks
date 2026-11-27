import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { RARITY_LABEL, RARITY_TONE, formatSerial } from '../data/catalog'
import { salvageCard, useGameState } from '../store/useGameStore'
import type { CardDef } from '../types/game'
import { CardVisual } from './CardVisual'

const ZOOM_MIN = 0.6
const ZOOM_MAX = 2.4

type CardInspectProps = {
  card: CardDef
  isNew?: boolean
  onClose: () => void
}

function clampZoom(value: number) {
  const stepped = Math.round(value * 10) / 10
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, stepped))
}

/** 放大检视一张卡，可缩放、平面旋转，并拖动调整倾斜。 */
export function CardInspect({ card, isNew = false, onClose }: CardInspectProps) {
  const owned = useGameState().owned[card.id] ?? 0
  const closeRef = useRef<HTMLButtonElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  const drag = useRef<{ x: number; y: number; tiltX: number; tiltY: number } | null>(null)
  const [zoom, setZoom] = useState(1)
  const [turn, setTurn] = useState(0)
  const [tiltX, setTiltX] = useState(0)
  const [tiltY, setTiltY] = useState(0)
  const [dragging, setDragging] = useState(false)

  onCloseRef.current = onClose

  useEffect(() => {
    // 方向键旋转，加减号缩放，滚轮缩放，Esc 关闭。
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
      if (event.key === '-' || event.key === '_') setZoom((value) => clampZoom(value - 0.2))
      if (event.key === '=' || event.key === '+') setZoom((value) => clampZoom(value + 0.2))
      if (event.key === '0') resetView()
    }
    const stage = stageRef.current
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      setZoom((value) => clampZoom(value + (event.deltaY > 0 ? -0.1 : 0.1)))
    }
    stage?.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
      stage?.removeEventListener('wheel', onWheel)
    }
  }, [])

  /** 把缩放、旋转和倾斜收回最初的正面。 */
  function resetView() {
    setZoom(1)
    setTurn(0)
    setTiltX(0)
    setTiltY(0)
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { x: event.clientX, y: event.clientY, tiltX, tiltY }
    setDragging(true)
  }

  /** 按指针位移改俯仰和左右倾斜。 */
  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const start = drag.current
    if (!start) return
    setTiltY(start.tiltY + (event.clientX - start.x) * 0.45)
    setTiltX(start.tiltX - (event.clientY - start.y) * 0.35)
  }

  function onPointerUp() {
    drag.current = null
    setDragging(false)
  }

  return createPortal(
    <div className="inspect" role="dialog" aria-modal="true" aria-label={`${card.name} 详情`}>
      <button type="button" className="inspect-backdrop" aria-label="关闭详情" tabIndex={-1} onClick={onClose} />
      <div className="inspect-panel">
        <button ref={closeRef} type="button" className="inspect-close" onClick={onClose}>
          ✕
        </button>
        <div className="inspect-view">
          <div
            ref={stageRef}
            className={`inspect-stage${dragging ? ' is-dragging' : ''}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <div
              className="inspect-pose"
              style={{
                transform: `scale(${zoom}) rotateX(${tiltX}deg) rotateY(${tiltY}deg) rotate(${turn}deg)`,
              }}
            >
              <CardVisual card={card} size="lg" still isNew={isNew} />
            </div>
          </div>
        </div>
        <div className="inspect-copy">
          <span className="rarity-pill" style={{ color: RARITY_TONE[card.rarity] }}>
            {card.rarity} · {RARITY_LABEL[card.rarity]}
          </span>
          <h2>{card.name}</h2>
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
