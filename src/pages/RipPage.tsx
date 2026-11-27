import { useEffect, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import { sound } from '../audio/soundEngine'
import { CardInspect } from '../components/CardInspect'
import { CardVisual } from '../components/CardVisual'
import { PackDetail } from '../components/PackDetail'
import { PackVisual } from '../components/PackVisual'
import { RARITY_LABEL, RARITY_RANK, getCard, getOffer, listOffers } from '../data/catalog'
import { bestRarity, rollPack } from '../data/pull'
import {
  commitOpen,
  consumeRipToken,
  countPacks,
  getState,
  goTo,
  useGameState,
} from '../store/useGameStore'
import type { CardDef, DrawnCard, Rarity } from '../types/game'

const TEAR_LIMIT = 0.78

type Phase = 'pick' | 'sealed' | 'burst' | 'reveal'

type Ceremony = {
  phase: Phase
  packId: string | null
  roll: CardDef[]
  drawn: DrawnCard[]
  tear: number
  peek: Rarity | null
  shaking: boolean
  spring: boolean
  flipped: Record<string, boolean>
}

function blankCeremony(): Ceremony {
  return {
    phase: 'pick',
    packId: null,
    roll: [],
    drawn: [],
    tear: 0,
    peek: null,
    shaking: false,
    spring: false,
    flipped: {},
  }
}

/** 从商店跳进来时，用这一次请求里的卡包直接开拆。 */
function createOpening(): Ceremony {
  const current = getState()
  if (current.ripToken > 0 && current.inventory[current.ripPackId] > 0) {
    return {
      ...blankCeremony(),
      phase: 'sealed',
      packId: current.ripPackId,
      roll: rollPack(getOffer(current.ripPackId)),
    }
  }
  return blankCeremony()
}

/** 拆卡室：摇包看封边，撕开或回弹，金光之后再逐张翻开。 */
export function RipPage() {
  const state = useGameState()
  const [ceremony, setCeremony] = useState<Ceremony>(createOpening)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [packDetailId, setPackDetailId] = useState<string | null>(null)
  const tearRef = useRef(0)
  const packIdRef = useRef<string | null>(ceremony.packId)
  const rollRef = useRef<CardDef[]>(ceremony.roll)
  const drag = useRef<{ x: number } | null>(null)
  const autoRef = useRef(false)
  const committed = useRef(false)
  const raf = useRef(0)
  const burstTimer = useRef(0)

  packIdRef.current = ceremony.packId
  rollRef.current = ceremony.roll
  tearRef.current = ceremony.tear

  useEffect(() => {
    consumeRipToken()
    return () => {
      cancelAnimationFrame(raf.current)
      window.clearTimeout(burstTimer.current)
    }
  }, [])

  /** 爆开时震一下屏幕，并通知背景洒出金屑。 */
  useEffect(() => {
    if (ceremony.phase !== 'burst') return
    document.documentElement.classList.add('is-screen-shaking')
    window.dispatchEvent(new Event('prism-burst'))
    const timer = window.setTimeout(() => document.documentElement.classList.remove('is-screen-shaking'), 340)
    return () => {
      window.clearTimeout(timer)
      document.documentElement.classList.remove('is-screen-shaking')
    }
  }, [ceremony.phase])

  const begin = (id: string) => {
    cancelAnimationFrame(raf.current)
    autoRef.current = false
    committed.current = false
    tearRef.current = 0
    setDetailId(null)
    setCeremony({
      ...blankCeremony(),
      phase: 'sealed',
      packId: id,
      roll: rollPack(getOffer(id)),
    })
  }

  const completeTear = () => {
    cancelAnimationFrame(raf.current)
    autoRef.current = false
    if (committed.current) return
    const packId = packIdRef.current
    const roll = rollRef.current
    if (!packId || roll.length === 0) return
    committed.current = true
    const drawn = commitOpen(packId, roll)
    if (drawn.length === 0) {
      committed.current = false
      return
    }
    tearRef.current = 1
    sound.burst()
    navigator.vibrate?.(16)
    setCeremony((prev) => ({ ...prev, phase: 'burst', tear: 1, drawn, spring: false }))
    burstTimer.current = window.setTimeout(() => {
      setCeremony((prev) => (prev.phase === 'burst' ? { ...prev, phase: 'reveal' } : prev))
    }, 1050)
  }

  const onSealDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (ceremony.phase !== 'sealed' || autoRef.current) return
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { x: event.clientX }
    setCeremony((prev) => ({ ...prev, spring: false }))
  }

  const onSealMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (!drag.current) return
    const value = Math.min(1, Math.max(0, (event.clientX - drag.current.x) / 220))
    tearRef.current = value
    setCeremony((prev) => ({ ...prev, tear: value, spring: false }))
    sound.tear(value)
  }

  const onSealUp = () => {
    if (!drag.current) return
    drag.current = null
    if (tearRef.current >= TEAR_LIMIT) {
      completeTear()
      return
    }
    // 先挂上回弹，下一帧再把封条收回去，松手才有弹性。
    setCeremony((prev) => ({ ...prev, spring: true }))
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (committed.current) return
        tearRef.current = 0
        setCeremony((prev) => (prev.phase === 'sealed' ? { ...prev, tear: 0, spring: true } : prev))
      })
    })
  }

  const onSealKey = (delta: number) => {
    if (ceremony.phase !== 'sealed' || autoRef.current || committed.current) return
    const value = Math.min(1, Math.max(0, tearRef.current + delta))
    tearRef.current = value
    sound.tear(value)
    if (value >= TEAR_LIMIT) {
      completeTear()
      return
    }
    setCeremony((prev) => ({ ...prev, tear: value, spring: value === 0 }))
  }

  const autoTear = () => {
    if (ceremony.phase !== 'sealed' || autoRef.current || committed.current) return
    autoRef.current = true
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const duration = reduce ? 280 : 1700
    const start = performance.now()
    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - progress) * (1 - progress)
      tearRef.current = eased
      setCeremony((prev) => ({ ...prev, tear: eased, spring: false }))
      sound.tear(eased)
      if (progress < 1) raf.current = requestAnimationFrame(step)
      else completeTear()
    }
    raf.current = requestAnimationFrame(step)
  }

  const shake = () => {
    if (ceremony.phase !== 'sealed' || ceremony.roll.length === 0) return
    sound.shake()
    setCeremony((prev) => ({ ...prev, shaking: true, peek: bestRarity(prev.roll) }))
    window.setTimeout(() => {
      setCeremony((prev) => ({ ...prev, shaking: false }))
    }, 560)
  }

  const flipOne = (item: DrawnCard) => {
    if (ceremony.flipped[item.instanceId]) return
    sound.flip(getCard(item.cardId).rarity)
    setCeremony((prev) => ({
      ...prev,
      flipped: { ...prev.flipped, [item.instanceId]: true },
    }))
  }

  const flipAll = () => {
    const pending = ceremony.drawn.some((item) => !ceremony.flipped[item.instanceId])
    if (!pending) return
    let top: Rarity = 'N'
    for (const item of ceremony.drawn) {
      const rarity = getCard(item.cardId).rarity
      if (RARITY_RANK[rarity] > RARITY_RANK[top]) top = rarity
    }
    sound.flip(top)
    setCeremony((prev) => {
      const flipped = { ...prev.flipped }
      for (const item of prev.drawn) flipped[item.instanceId] = true
      return { ...prev, flipped }
    })
  }

  const detail = ceremony.drawn.find((item) => item.instanceId === detailId) ?? null
  const stock = ceremony.packId ? (state.inventory[ceremony.packId] ?? 0) : 0
  const totalPacks = countPacks(state.inventory)
  const ownedPacks = listOffers().filter((pack) => (state.inventory[pack.id] ?? 0) > 0)
  const allFlipped =
    ceremony.drawn.length > 0 && ceremony.drawn.every((item) => ceremony.flipped[item.instanceId])

  return (
    <section className="page rip-room">
      <p className="sr-only" aria-live="polite">
        {ceremony.phase === 'reveal' ? '封口已撕开，可以翻卡' : ''}
      </p>
      {ceremony.phase === 'burst' && <div className="golden-flash" aria-hidden />}

      {ceremony.phase === 'pick' && ownedPacks.length === 0 && (
        <div className="empty">
          <p>还没有待拆的卡包。</p>
          <button type="button" className="btn btn-gold" onClick={() => goTo('shop')}>
            前往商店
          </button>
        </div>
      )}

      {ceremony.phase === 'pick' && ownedPacks.length > 0 && (
        <div className="rip-center">
          <div className="pack-picker">
            {ownedPacks.map((pack) => (
              <div key={pack.id} className="pack-choice">
                <button
                  type="button"
                  className="pack-open"
                  aria-label={`${pack.seriesName} ${pack.tierName} ×${state.inventory[pack.id]}`}
                  onClick={() => begin(pack.id)}
                >
                  <PackVisual offerId={pack.id} seal="display" />
                  <strong>{pack.seriesName}</strong>
                  <em>
                    {pack.tierName} ×{state.inventory[pack.id]}
                  </em>
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setPackDetailId(pack.id)}>
                  查看详情
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {ceremony.phase !== 'pick' && ceremony.packId && (
        <>
          <div className="pack-switch">
            {ownedPacks.map((pack) => (
              <button
                key={pack.id}
                type="button"
                className={pack.id === ceremony.packId ? 'is-on' : ''}
                aria-label={`${pack.seriesName} ${pack.tierName} ×${state.inventory[pack.id]}`}
                onClick={() => begin(pack.id)}
              >
                <span className="pack-thumb" aria-hidden>
                  <PackVisual offerId={pack.id} seal="display" />
                </span>
                <span>
                  {pack.seriesName} {pack.tierName} ×{state.inventory[pack.id]}
                </span>
              </button>
            ))}
          </div>
          <div className="rip-center">
            {ceremony.peek && ceremony.phase === 'sealed' && (
              <div className="peek-banner">
                <span className="gold-foil-text">
                  {ceremony.peek} · {RARITY_LABEL[ceremony.peek]}
                </span>
              </div>
            )}
            {ceremony.phase !== 'reveal' && (
              <PackVisual
                offerId={ceremony.packId}
                size="lg"
                tear={ceremony.tear}
                shaking={ceremony.shaking}
                spring={ceremony.spring}
                ripped={ceremony.phase === 'burst'}
                peek={ceremony.peek}
                seal={ceremony.phase === 'sealed' ? 'live' : 'display'}
                onSealDown={onSealDown}
                onSealMove={onSealMove}
                onSealUp={onSealUp}
                onSealKey={onSealKey}
              />
            )}
            {ceremony.phase === 'sealed' && <p className="rip-note">向右拖动封口划开</p>}
            {ceremony.phase === 'reveal' && (
              <div className="cards-fan">
                {ceremony.drawn.map((item, index) => {
                  const card = getCard(item.cardId)
                  return (
                    <div
                      key={item.instanceId}
                      className="fan-pop"
                      style={{ animationDelay: `${index * 80}ms` }}
                    >
                      <CardVisual
                        card={card}
                        flippable
                        flipped={Boolean(ceremony.flipped[item.instanceId])}
                        isNew={item.isNew}
                        onFlip={() => flipOne(item)}
                        onOpen={() => setDetailId(item.instanceId)}
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          <div className="glass-dock">
            {ceremony.phase === 'sealed' && (
              <>
                <button type="button" className="btn btn-ghost" onClick={() => ceremony.packId && setPackDetailId(ceremony.packId)}>
                  查看详情
                </button>
                <button type="button" className="btn btn-ghost" onClick={shake}>
                  摇包
                </button>
                <button type="button" className="btn btn-gold" onClick={autoTear}>
                  撕开封口
                </button>
              </>
            )}
            {ceremony.phase === 'reveal' && (
              <>
                {!allFlipped && (
                  <button type="button" className="btn btn-ghost" onClick={flipAll}>
                    全部翻开
                  </button>
                )}
                <button type="button" className="btn btn-ghost" onClick={() => goTo('album')}>
                  去图鉴
                </button>
                {stock > 0 && (
                  <button type="button" className="btn btn-gold" onClick={() => begin(ceremony.packId!)}>
                    再拆一包
                  </button>
                )}
                {stock === 0 && totalPacks > 0 && (
                  <button type="button" className="btn btn-gold" onClick={() => setCeremony(blankCeremony())}>
                    换一包
                  </button>
                )}
                {totalPacks === 0 && (
                  <button type="button" className="btn btn-gold" onClick={() => goTo('shop')}>
                    去商店
                  </button>
                )}
              </>
            )}
          </div>
        </>
      )}
      {ceremony.phase === 'reveal' && detail && ceremony.flipped[detail.instanceId] && (
        <CardInspect card={getCard(detail.cardId)} isNew={detail.isNew} onClose={() => setDetailId(null)} />
      )}
      {packDetailId && <PackDetail offerId={packDetailId} onClose={() => setPackDetailId(null)} />}
    </section>
  )
}
