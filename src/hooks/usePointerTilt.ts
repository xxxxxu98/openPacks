import { useState } from 'react'
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react'
import { useRef } from 'react'

export interface TiltPose {
  rotateX: number
  rotateY: number
  glareX: number
  glareY: number
  pupilX: number
  pupilY: number
}

export const REST_POSE: TiltPose = {
  rotateX: 0,
  rotateY: 0,
  glareX: 50,
  glareY: 36,
  pupilX: 0,
  pupilY: 0,
}

/** 按卡面当前的倾斜，把屏幕上的指针投回卡面。 */
function surfacePoint(sx: number, sy: number, ax: number, ay: number, distance: number) {
  const rx = (ax * Math.PI) / 180
  const ry = (ay * Math.PI) / 180
  const cX = Math.cos(rx)
  const sX = Math.sin(rx)
  const cY = Math.cos(ry)
  const sY = Math.sin(ry)
  if (distance <= 0) return { x: sx, y: sy }
  const a11 = cY - (sx / distance) * sY * cX
  const a12 = (sx / distance) * sX
  const a21 = sY * sX - (sy / distance) * sY * cX
  const a22 = cX + (sy / distance) * sX
  const det = a11 * a22 - a12 * a21
  if (Math.abs(det) < 1e-4) return { x: sx, y: sy }
  return {
    x: (sx * a22 - a12 * sy) / det,
    y: (a11 * sy - sx * a21) / det,
  }
}

function layoutRect(element: HTMLElement) {
  const parent = element.parentElement
  const width = element.offsetWidth
  const height = element.offsetHeight
  if (!parent) {
    const box = element.getBoundingClientRect()
    return { left: box.left, top: box.top, width, height }
  }
  const box = parent.getBoundingClientRect()
  return {
    left: box.left + element.offsetLeft,
    top: box.top + element.offsetTop,
    width,
    height,
  }
}

function perspectiveOf(element: HTMLElement) {
  const raw = getComputedStyle(element.parentElement ?? element).perspective
  const value = Number.parseFloat(raw)
  return Number.isFinite(value) && value > 0 ? value : 0
}

function offsetIn(root: HTMLElement, node: HTMLElement) {
  let x = 0
  let y = 0
  let current: HTMLElement | null = node
  while (current && current !== root) {
    x += current.offsetLeft
    y += current.offsetTop
    const next: Element | null = current.offsetParent
    if (!(next instanceof HTMLElement)) return null
    current = next
  }
  return current === root ? { x, y } : null
}

function glarePercent(element: HTMLElement, localX: number, localY: number) {
  const art = element.querySelector('.card-art')
  if (!(art instanceof HTMLElement)) {
    return {
      x: (localX / element.offsetWidth) * 100,
      y: (localY / element.offsetHeight) * 100,
    }
  }
  const origin = offsetIn(element, art)
  const width = art.offsetWidth || 1
  const height = art.offsetHeight || 1
  if (!origin) {
    return {
      x: (localX / element.offsetWidth) * 100,
      y: (localY / element.offsetHeight) * 100,
    }
  }
  return {
    x: ((localX - origin.x) / width) * 100,
    y: ((localY - origin.y) / height) * 100,
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

/** 把指针在元素上的位置换成倾斜、高光和瞳孔偏移，离开后回到正中。 */
export function usePointerTilt<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [pose, setPose] = useState<TiltPose>(REST_POSE)
  const [resting, setResting] = useState(true)

  const onPointerMove = (event: ReactPointerEvent<T>) => {
    const element = ref.current
    if (!element) return
    const rect = layoutRect(element)
    if (rect.width === 0 || rect.height === 0) return
    const nx = (event.clientX - rect.left) / rect.width
    const ny = (event.clientY - rect.top) / rect.height
    const rotateX = (0.5 - ny) * 8
    const rotateY = (nx - 0.5) * 10
    const hit = surfacePoint(
      event.clientX - (rect.left + rect.width / 2),
      event.clientY - (rect.top + rect.height / 2),
      rotateX,
      rotateY,
      perspectiveOf(element),
    )
    const glare = glarePercent(element, hit.x + rect.width / 2, hit.y + rect.height / 2)
    setResting(false)
    setPose({
      rotateX,
      rotateY,
      glareX: clamp(glare.x, 0, 100),
      glareY: clamp(glare.y, 0, 100),
      pupilX: (nx - 0.5) * 2,
      pupilY: (ny - 0.5) * 2,
    })
  }

  const onPointerLeave = () => {
    setResting(true)
    setPose(REST_POSE)
  }

  return { ref, pose, resting, onPointerMove, onPointerLeave }
}

export type TiltBind<T extends HTMLElement> = {
  ref: RefObject<T | null>
  onPointerMove: (event: ReactPointerEvent<T>) => void
  onPointerLeave: () => void
}
