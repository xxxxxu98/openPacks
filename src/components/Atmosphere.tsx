import { useEffect, useRef } from 'react'

type Mote = { x: number; y: number; r: number; vx: number; vy: number; a: number }
type Spark = { x: number; y: number; vx: number; vy: number; size: number; color: string; alpha: number; decay: number }

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

    const resize = () => {
      dust.width = fx.width = window.innerWidth
      dust.height = fx.height = window.innerHeight
    }
    const burst = () => {
      const x = window.innerWidth / 2
      const y = window.innerHeight * 0.42
      const palette = ['#fde68a', '#ffffff', '#38bdf8', '#fbbf24', '#f472b6']
      for (let i = 0; i < 70; i += 1) {
        const angle = Math.random() * Math.PI * 2
        const speed = 2.4 + Math.random() * 7
        sparks.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2,
          size: 2 + Math.random() * 4,
          color: palette[i % palette.length] ?? '#fde68a',
          alpha: 1,
          decay: 0.012 + Math.random() * 0.02,
        })
      }
      document.querySelector('.volumetric-beams')?.classList.add('gold-surge')
      window.setTimeout(() => document.querySelector('.volumetric-beams')?.classList.remove('gold-surge'), 900)
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('prism-burst', burst)
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
        spark.vy += 0.14
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
