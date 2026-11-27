import { useState } from 'react'
import { CardInspect } from '../components/CardInspect'
import { CardVisual } from '../components/CardVisual'
import { CARDS, PACK_SERIES, cardsOfSeries, formatSerial, getCard, listOffers } from '../data/catalog'
import { resetSave, useGameState } from '../store/useGameStore'
import type { RarityFilter } from '../types/game'

const FILTERS: readonly RarityFilter[] = ['ALL', 'SECRET', 'SSR', 'SR', 'R', 'N']

/** 图鉴列出全套闪卡，持有张数写在卡下，已收集的可以放大检视，重复的可以分解掉。 */
export function AlbumPage() {
  const state = useGameState()
  const [seriesId, setSeriesId] = useState('ALL')
  const [filter, setFilter] = useState<RarityFilter>('ALL')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [confirm, setConfirm] = useState(false)
  const pool = seriesId === 'ALL' ? CARDS : cardsOfSeries(seriesId)
  const collected = pool.reduce((sum, card) => sum + ((state.owned[card.id] ?? 0) > 0 ? 1 : 0), 0)
  const width = String(pool.length).length
  const starter = listOffers()[0]
  const visible = pool.filter((card) => filter === 'ALL' || card.rarity === filter)
  const active = activeId ? getCard(activeId) : null

  const confirmReset = () => {
    setConfirm(false)
    setActiveId(null)
    resetSave()
  }

  return (
    <section className="page">
      <div className="section-head dex-head">
        <div className="dex-title">
          <h1>二十四节气</h1>
          <span className="progress-pill">
            {String(collected).padStart(width, '0')} / {pool.length}
          </span>
        </div>
        {PACK_SERIES.length > 1 && (
          <div className="filters" role="tablist" aria-label="按卡包筛选">
            <button type="button" className={seriesId === 'ALL' ? 'is-on' : ''} aria-pressed={seriesId === 'ALL'} onClick={() => setSeriesId('ALL')}>
              全部卡包
            </button>
            {PACK_SERIES.map((series) => (
              <button
                key={series.id}
                type="button"
                className={seriesId === series.id ? 'is-on' : ''}
                aria-pressed={seriesId === series.id}
                onClick={() => setSeriesId(series.id)}
              >
                {series.name}
              </button>
            ))}
          </div>
        )}
        <div className="filters" role="tablist" aria-label="按稀有度筛选">
          {FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              className={filter === item ? 'is-on' : ''}
              aria-pressed={filter === item}
              onClick={() => setFilter(item)}
            >
              {item === 'ALL' ? '全部' : item}
            </button>
          ))}
        </div>
      </div>
      <div className="dex-bar" aria-hidden>
        <span style={{ width: `${pool.length === 0 ? 0 : (collected / pool.length) * 100}%` }} />
      </div>
      <div className="binder">
        {visible.map((card) => {
          const count = state.owned[card.id] ?? 0
          if (count <= 0) {
            return (
              <div key={card.id} className="slot-locked">
                <strong>{formatSerial(card)}</strong>
                <span>{card.rarity}</span>
              </div>
            )
          }
          return (
            <button
              key={card.id}
              type="button"
              className="slot-owned"
              onClick={() => setActiveId(card.id)}
            >
              <CardVisual card={card} size="sm" />
              <span className="slot-count">×{count}</span>
            </button>
          )
        })}
      </div>

      <div className="reset-row">
        {confirm ? (
          <>
            <p>
              {starter
                ? `清空后库存和图鉴回到最初，并赠送 1 个${starter.seriesName} · ${starter.tierName}。`
                : '清空后库存和图鉴回到最初。'}
            </p>
            <button type="button" className="btn btn-danger" onClick={confirmReset}>
              确认清空
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setConfirm(false)}>
              取消
            </button>
          </>
        ) : (
          <button type="button" className="btn btn-ghost" onClick={() => setConfirm(true)}>
            重置存档
          </button>
        )}
      </div>

      {active && <CardInspect card={active} onClose={() => setActiveId(null)} />}
    </section>
  )
}
