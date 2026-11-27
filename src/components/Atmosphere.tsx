import { useEffect, useRef } from 'react'
import type { Rarity } from '../types/game'

type Mote = { x: number; y: number; r: number; vx: number; vy: number; a: number }
type Spark = {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  alpha: number
  decay: number
  gravity: number
}

type GradeLook = {
  count: number
  colors: readonly string[]
  speed: number
  gravity: number
  size: number
  decay: number
}

/** 碎光的数量、颜色和滞空按品级拉开。 */
const GRADE_LOOK: Record<Rarity, GradeLook> = {
  N: { count: 10, colors: ['#e6dccb', '#f3efe4'], speed: 2.1, gravity: 0.16, size: 1.8, decay: 0.028 },
  R: { count: 20, colors: ['#d5e8f6', '#7eb6de', '#f4fbff'], speed: 3.2, gravity: 0.13, size: 2.2, decay: 0.022 },
  SR: { count: 46, colors: ['#7ddec4', '#e7fff6', '#146b56', '#f3faf6'], speed: 5.4, gravity: 0.09, size: 2.8, decay: 0.016 },
  SSR: { count: 78, colors: ['#f0d48a', '#fff6d4', '#ffffff', '#c6a15a'], speed: 6.6, gravity: 0.06, size: 3.2, decay: 0.012 },
  SECRET: { count: 120, colors: ['#f3eaff', '#ffffff', '#d7c4ef', '#8d6aaf', '#5c3478'], speed: 7.8, gravity: 0.04, size: 3.6, decay: 0.009 },
}

/** 暗房体积光、地板和漂浮微尘。拆卡爆发时在画面中央撒一层金粉。 */
export function Atmosphere() {
  const dustRef = useRef<HTMLCanvasElement>(null)
  const fxRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const dust = dustRef.current
    const fx = fxRef.current
    if (!dust || !fx) return
    const dustCtx = dust.getContext('2d')
    const fxCtx = fx.getContext('2d')
    if (!dustCtx || !fxCtx) return

    const motes: Mote[] = Array.from({ length: 46 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: 0.6 + Math.random() * 1.6,
      vy: -0.15 - Math.random() * 0.35,
      vx: (Math.random() - 0.5) * 0.25,
      a: 0.15 + Math.random() * 0.45,
    }))
    const sparks: Spark[] = []
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const resize = () => {
      dust.width = fx.width = window.innerWidth
      dust.height = fx.height = window.innerHeight
    }
    /** 按品级在落点洒不同颜色和数量的碎光。 */
    const spray = (rarity: Rarity, x: number, y: number, scale: number) => {
      if (reduced) return
      const look = GRADE_LOOK[rarity]
      const total = Math.round(look.count * scale)
      const ring = rarity === 'SSR' || rarity === 'SECRET' ? 18 : 0
      for (let i = 0; i < total; i += 1) {
        const angle = i < ring ? (i / ring) * Math.PI * 2 : Math.random() * Math.PI * 2
        const speed = look.speed * (i < ring ? 0.85 : 0.35 + Math.random() * 0.9)
        sparks.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - speed * 0.25,
          size: look.size * (0.6 + Math.random() * 0.8),
          color: look.colors[i % look.colors.length] ?? '#f0d48a',
          alpha: 1,
          decay: look.decay + Math.random() * 0.008,
          gravity: look.gravity,
        })
      }
    }
    const burst = (event: Event) => {
      const rarity = (event as CustomEvent<{ rarity?: Rarity }>).detail?.rarity ?? 'R'
      spray(rarity, window.innerWidth / 2, window.innerHeight * 0.42, rarity === 'N' ? 2.4 : 1.35)
      document.querySelector('.volumetric-beams')?.classList.add('gold-surge')
      window.setTimeout(() => document.querySelector('.volumetric-beams')?.classList.remove('gold-surge'), 900)
    }
    const reveal = (event: Event) => {
      const detail = (event as CustomEvent<{ rarity?: Rarity; x?: number; y?: number }>).detail
      if (!detail?.rarity) return
      spray(detail.rarity, detail.x ?? window.innerWidth / 2, detail.y ?? window.innerHeight * 0.45, 1)
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('prism-burst', burst)
    window.addEventListener('grade-reveal', reveal)
    let frame = 0
    const loop = () => {
      dustCtx.clearRect(0, 0, dust.width, dust.height)
      for (const mote of motes) {
        mote.x += mote.vx
        mote.y += mote.vy
        if (mote.y < 0) mote.y = dust.height
        if (mote.x < 0) mote.x = dust.width
        if (mote.x > dust.width) mote.x = 0
        dustCtx.beginPath()
        dustCtx.arc(mote.x, mote.y, mote.r, 0, Math.PI * 2)
        dustCtx.fillStyle = `rgba(253, 230, 138, ${mote.a * 0.75})`
        dustCtx.fill()
      }
      fxCtx.clearRect(0, 0, fx.width, fx.height)
      for (let i = sparks.length - 1; i >= 0; i -= 1) {
        const spark = sparks[i]
        if (!spark) continue
        spark.x += spark.vx
        spark.y += spark.vy
        spark.vy += spark.gravity
        spark.alpha -= spark.decay
        if (spark.alpha <= 0) {
          sparks.splice(i, 1)
          continue
        }
        fxCtx.globalAlpha = spark.alpha
        fxCtx.fillStyle = spark.color
        fxCtx.beginPath()
        fxCtx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2)
        fxCtx.fill()
      }
      fxCtx.globalAlpha = 1
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('prism-burst', burst)
      window.removeEventListener('grade-reveal', reveal)
    }
  }, [])

  return (
    <>
      <div className="studio-bg" aria-hidden>
        <div className="volumetric-beams" />
        <div className="studio-spotlight" />
        <div className="smoke-layer" />
        <div className="studio-floor" />
      </div>
      <canvas ref={dustRef} className="dust-canvas" aria-hidden />
      <canvas ref={fxRef} className="fx-canvas" aria-hidden />
    </>
  )
}
