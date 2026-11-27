import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'

const ZOOM_MIN = 0.6
const ZOOM_MAX = 2.4
const TILT_X = 0.35
const TILT_Y = 0.45

function clampZoom(value: number) {
  const stepped = Math.round(value * 10) / 10
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, stepped))
}

type PoseStart = {
  tiltX?: number
  tiltY?: number
}

/** 检视和开卡演出共用的卡姿。滚轮改大小，拖动改倾斜。 */
export function useCardPose(start: PoseStart = {}) {
  const nodeRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; y: number; tiltX: number; tiltY: number } | null>(null)
  const [zoom, setZoom] = useState(1)
  const [tiltX, setTiltX] = useState(start.tiltX ?? 0)
  const [tiltY, setTiltY] = useState(start.tiltY ?? 0)
  const [dragging, setDragging] = useState(false)

  /** 按一档放大或缩小。 */
  function zoomBy(delta: number) {
    setZoom((value) => clampZoom(value + delta))
  }

  useEffect(() => {
    const node = nodeRef.current
    if (!node) return
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      zoomBy(event.deltaY > 0 ? -0.1 : 0.1)
    }
    node.addEventListener('wheel', onWheel, { passive: false })
    return () => node.removeEventListener('wheel', onWheel)
  }, [])

  /** 收回正面，大小回到一倍。 */
  function reset() {
    setZoom(1)
    setTiltX(0)
    setTiltY(0)
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return
    drag.current = { x: event.clientX, y: event.clientY, tiltX, tiltY }
    setDragging(true)
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // 这次按下没有可捕获的指针，移动仍从这张卡冒泡上来。
    }
  }

  /** 按指针位移改俯仰和左右倾斜。 */
  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const startDrag = drag.current
    if (!startDrag) return
    setTiltY(startDrag.tiltY + (event.clientX - startDrag.x) * TILT_Y)
    setTiltX(startDrag.tiltX - (event.clientY - startDrag.y) * TILT_X)
  }

  function onPointerUp() {
    drag.current = null
    setDragging(false)
  }

  return {
    ref: nodeRef,
    zoom,
    tiltX,
    tiltY,
    dragging,
    zoomBy,
    reset,
    transform: `scale(${zoom}) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  }
}
