import { useState } from 'react'
import { PackDetail } from '../components/PackDetail'
import { PackVisual } from '../components/PackVisual'
import { BASE_WEIGHTS, PACK_SERIES, RARITY_LABEL, RARITY_TONE, listOffers } from '../data/catalog'
import { buyPack, getState, useGameState } from '../store/useGameStore'
import type { Rarity } from '../types/game'

const RARITIES: readonly Rarity[] = ['N', 'R', 'SR', 'SSR', 'SECRET']

type PurchaseReceipt = {
  id: string
  name: string
  stock: number
  tick: number
}

/** 商店按卡包类型分组；没有在售卡包时只留空货架。 */
export function ShopPage() {
  const state = useGameState()
  const [receipt, setReceipt] = useState<PurchaseReceipt | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)

  /** 买入一包，并把入手结果留在刚点的那张卡上。 */
  function purchase(id: string, name: string) {
    buyPack(id)
    setReceipt({
      id,
      name,
      stock: getState().inventory[id] ?? 0,
      tick: Date.now(),
    })
  }

  return (
    <section className="page">
      {receipt && (
        <p className="shop-toast" role="status" key={receipt.tick}>
          已入手 {receipt.name}，现有 ×{receipt.stock}
        </p>
      )}
      <div className="section-head">
        <div>
          <h1>卡包补给</h1>
          <p>
            {PACK_SERIES.length === 0
              ? '货架空着。'
              : '每种卡包单独一池。购买时按保底分低爆、中爆、高爆。'}
          </p>
        </div>
      </div>
      {PACK_SERIES.length === 0 && (
        <div className="empty">
          <p>还没有卡包。</p>
        </div>
      )}
      {PACK_SERIES.map((series) => {
        const offers = listOffers(series.id)
        if (offers.length === 0) return null
        return (
          <section key={series.id} className="shop-series">
            <div className="shop-series-head">
              <h2>{series.name}</h2>
              <p>{series.blurb}</p>
              <div className="weights" aria-hidden>
                {RARITIES.map((rarity) => (
                  <i key={rarity} style={{ flexGrow: BASE_WEIGHTS[rarity], background: RARITY_TONE[rarity] }} />
                ))}
              </div>
              <p className="weight-legend">
                {RARITIES.map((rarity) => `${RARITY_LABEL[rarity]} ${BASE_WEIGHTS[rarity]}`).join(' · ')}
              </p>
            </div>
            <div className="shop-grid">
              {offers.map((offer) => {
                const stock = state.inventory[offer.id] ?? 0
                const bought = receipt?.id === offer.id ? receipt : null
                return (
                  <article key={offer.id} className={`shop-card${bought ? ' is-bought' : ''}`}>
                    <div className="shop-meta">
                      <span className={bought ? 'is-pop' : undefined} key={bought ? bought.tick : 'stock'}>
                        ×{stock}
                      </span>
                      <span>{offer.tierName}</span>
                    </div>
                    <PackVisual offerId={offer.id} seal="display" />
                    <h3>{offer.tierName}</h3>
                    <p className="blurb">{offer.blurb}</p>
                    <div className="shop-actions">
                      <button type="button" className="btn btn-ghost" onClick={() => setDetailId(offer.id)}>
                        查看详情
                      </button>
                      <button type="button" className="btn btn-gold" onClick={() => purchase(offer.id, offer.tierName)}>
                        {bought ? '再买一包' : '购买'}
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        )
      })}
      {detailId && <PackDetail offerId={detailId} onClose={() => setDetailId(null)} />}
    </section>
  )
}
