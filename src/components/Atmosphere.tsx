import { useEffect, useRef } from 'react'
import { GRADE_HIT_MS } from '../gradeHit'
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
  kind: 'dot' | 'streak'
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
  SR: { count: 64, colors: ['#7ddec4', '#e7fff6', '#146b56', '#f3faf6'], speed: 8, gravity: 0.08, size: 2.8, decay: 0.014 },
  SSR: { count: 110, colors: ['#f0d48a', '#fff6d4', '#ffffff', '#c6a15a'], speed: 10, gravity: 0.05, size: 3.4, decay: 0.01 },
  SECRET: { count: 150, colors: ['#f3eaff', '#ffffff', '#d7c4ef', '#8d6aaf', '#5c3478'], speed: 12, gravity: 0.035, size: 3.8, decay: 0.008 },
}

const HIGH_GRADE: ReadonlySet<Rarity> = new Set(['SR', 'SSR', 'SECRET'])

/** 暗房体积光和漂浮微尘。高等级翻开时从卡面打出穿过整屏的光痕。 */
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
    const waveTimers = new Set<number>()
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const resize = () => {
      dust.width = fx.width = window.innerWidth
      dust.height = fx.height = window.innerHeight
    }
    const pushSpark = (spark: Spark) => {
      if (sparks.length > 900) sparks.splice(0, sparks.length - 700)
      sparks.push(spark)
    }
    /** 按品级在落点洒不同颜色和数量的碎光。 */
    const spray = (rarity: Rarity, x: number, y: number, scale: number) => {
      if (reduced) return
      const look = GRADE_LOOK[rarity]
      const total = Math.round(look.count * scale)
      const ring = rarity === 'SSR' || rarity === 'SECRET' ? 28 : rarity === 'SR' ? 16 : 0
      for (let i = 0; i < total; i += 1) {
        const angle = i < ring ? (i / ring) * Math.PI * 2 : Math.random() * Math.PI * 2
        const speed = look.speed * (i < ring ? 0.9 : 0.35 + Math.random() * 0.9)
        pushSpark({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - speed * 0.25,
          size: look.size * (0.6 + Math.random() * 0.8),
          color: look.colors[i % look.colors.length] ?? '#f0d48a',
          alpha: 1,
          decay: look.decay + Math.random() * 0.008,
          gravity: look.gravity,
          kind: i % 3 === 0 ? 'streak' : 'dot',
        })
      }
    }
    /** 高等级从翻开的位置打出穿过整屏的光痕，并补一层落下的余烬。 */
    const flood = (rarity: Rarity, x: number, y: number, power: number) => {
      if (reduced || !HIGH_GRADE.has(rarity)) return
      const look = GRADE_LOOK[rarity]
      const count = Math.round((rarity === 'SECRET' ? 170 : rarity === 'SSR' ? 120 : 76) * power)
      const burst = rarity === 'SECRET' ? 28 : rarity === 'SSR' ? 22 : 15
      for (let i = 0; i < count; i += 1) {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.18
        const speed = burst * (0.45 + Math.random() * 0.9) * Math.max(power, 0.7)
        pushSpark({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: look.size * (0.7 + Math.random()),
          color: i % 5 === 0 ? '#ffffff' : (look.colors[i % look.colors.length] ?? '#fff'),
          alpha: 1,
          decay: look.decay * 0.55,
          gravity: look.gravity * 0.35,
          kind: i % 4 === 0 ? 'dot' : 'streak',
        })
      }
      const rain = Math.round((rarity === 'SECRET' ? 72 : rarity === 'SSR' ? 42 : 0) * power)
      for (let i = 0; i < rain; i += 1) {
        pushSpark({
          x: Math.random() * fx.width,
          y: -20 - Math.random() * 90,
          vx: (Math.random() - 0.5) * 1.6,
          vy: 3.4 + Math.random() * 6.5,
          size: look.size * (0.5 + Math.random() * 0.6),
          color: look.colors[i % look.colors.length] ?? '#fff',
          alpha: 0.9,
          decay: 0.006,
          gravity: 0.04,
          kind: 'streak',
        })
      }
      const edges = Math.round((rarity === 'SECRET' ? 64 : rarity === 'SSR' ? 36 : 0) * power)
      for (let i = 0; i < edges; i += 1) {
        const side = i % 4
        const ex = side === 1 ? fx.width + 8 : side === 3 ? -8 : Math.random() * fx.width
        const ey = side === 0 ? -8 : side === 2 ? fx.height + 8 : Math.random() * fx.height
        const angle = Math.atan2(y - ey, x - ex)
        const speed = 9 + Math.random() * 16
        pushSpark({
          x: ex,
          y: ey,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: look.size * 0.75,
          color: look.colors[i % look.colors.length] ?? '#fff',
          alpha: 0.95,
          decay: 0.009,
          gravity: 0.02,
          kind: 'streak',
        })
      }
    }
    const scheduleFlood = (rarity: Rarity, x: number, y: number) => {
      flood(rarity, x, y, 1)
      const delay = rarity === 'SECRET' ? 240 : 180
      const timer = window.setTimeout(() => flood(rarity, x, y, 0.72), delay)
      waveTimers.add(timer)
    }
    const burst = (event: Event) => {
      const rarity = (event as CustomEvent<{ rarity?: Rarity }>).detail?.rarity ?? 'R'
      spray(rarity, window.innerWidth / 2, window.innerHeight * 0.42, rarity === 'N' ? 2.4 : 1.35)
      if (HIGH_GRADE.has(rarity)) scheduleFlood(rarity, window.innerWidth / 2, window.innerHeight * 0.42)
      document.querySelector('.volumetric-beams')?.classList.add('gold-surge')
      window.setTimeout(() => document.querySelector('.volumetric-beams')?.classList.remove('gold-surge'), 900)
    }
    /** 停住之后从卡的四周往外飘一点余烬，不穿过卡面。 */
    const ember = (event: Event) => {
      const rarity = (event as CustomEvent<{ rarity?: Rarity }>).detail?.rarity
      if (reduced || (rarity !== 'SSR' && rarity !== 'SECRET')) return
      const look = GRADE_LOOK[rarity]
      const cx = fx.width / 2
      const cy = fx.height * 0.46
      const count = rarity === 'SECRET' ? 16 : 9
      for (let i = 0; i < count; i += 1) {
        const angle = Math.random() * Math.PI * 2
        const rx = 220 + Math.random() * 90
        const ry = 280 + Math.random() * 80
        const speed = 0.8 + Math.random() * 1.8
        pushSpark({
          x: cx + Math.cos(angle) * rx,
          y: cy + Math.sin(angle) * ry,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.35,
          size: look.size * (0.45 + Math.random() * 0.5),
          color: look.colors[i % look.colors.length] ?? '#fff',
          alpha: 0.85,
          decay: 0.006 + Math.random() * 0.004,
          gravity: 0.012,
          kind: i % 3 === 0 ? 'streak' : 'dot',
        })
      }
    }
    const reveal = (event: Event) => {
      const detail = (event as CustomEvent<{ rarity?: Rarity; x?: number; y?: number }>).detail
      if (!detail?.rarity) return
      const x = detail.x ?? window.innerWidth / 2
      const y = detail.y ?? window.innerHeight * 0.45
      if (!HIGH_GRADE.has(detail.rarity)) {
        spray(detail.rarity, x, y, 1)
        return
      }
      const rarity = detail.rarity
      const timer = window.setTimeout(() => {
        waveTimers.delete(timer)
        spray(rarity, x, y, 0.45)
        scheduleFlood(rarity, x, y)
      }, GRADE_HIT_MS)
      waveTimers.add(timer)
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('prism-burst', burst)
    window.addEventListener('grade-reveal', reveal)
    window.addEventListener('grade-ember', ember)
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
      fxCtx.lineCap = 'round'
      for (let i = sparks.length - 1; i >= 0; i -= 1) {
        const spark = sparks[i]
        if (!spark) continue
        spark.x += spark.vx
        spark.y += spark.vy
        spark.vx *= 0.988
        spark.vy *= 0.988
        spark.vy += spark.gravity
        spark.alpha -= spark.decay
        if (spark.alpha <= 0) {
          sparks.splice(i, 1)
          continue
        }
        fxCtx.globalAlpha = spark.alpha
        fxCtx.fillStyle = spark.color
        fxCtx.strokeStyle = spark.color
        if (spark.kind === 'streak') {
          const mag = Math.hypot(spark.vx, spark.vy) || 1
          const len = Math.min(92, 14 + mag * 1.8)
          fxCtx.lineWidth = Math.max(1.5, spark.size * 0.45)
          fxCtx.beginPath()
          fxCtx.moveTo(spark.x, spark.y)
          fxCtx.lineTo(spark.x - (spark.vx / mag) * len, spark.y - (spark.vy / mag) * len)
          fxCtx.stroke()
          fxCtx.globalAlpha = spark.alpha * 0.35
          fxCtx.beginPath()
          fxCtx.arc(spark.x, spark.y, spark.size * 2.2, 0, Math.PI * 2)
          fxCtx.fill()
        } else {
          fxCtx.beginPath()
          fxCtx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2)
          fxCtx.fill()
        }
      }
      fxCtx.globalAlpha = 1
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(frame)
      for (const timer of waveTimers) window.clearTimeout(timer)
      window.removeEventListener('resize', resize)
      window.removeEventListener('prism-burst', burst)
      window.removeEventListener('grade-reveal', reveal)
      window.removeEventListener('grade-ember', ember)
    }
  }, [])

  return (
    <>
      <div className="studio-bg" aria-hidden>
        <div className="volumetric-beams" />
        <div className="studio-spotlight" />
        <div className="smoke-layer" />
      </div>
      <canvas ref={dustRef} className="dust-canvas" aria-hidden />
      <canvas ref={fxRef} className="fx-canvas" aria-hidden />
    </>
  )
}
