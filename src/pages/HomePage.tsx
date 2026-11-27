import { useState } from 'react'
import { PackDetail } from '../components/PackDetail'
import { PackVisual } from '../components/PackVisual'
import { catalogSize, listOffers } from '../data/catalog'
import { countCollected, countPacks, goTo, useGameState } from '../store/useGameStore'

/** 首页把高爆档放在光柱下，并给出进入拆卡室或商店的入口。 */
export function HomePage() {
  const state = useGameState()
  const [detailId, setDetailId] = useState<string | null>(null)
  const packs = countPacks(state.inventory)
  const collected = countCollected(state.owned)
  const total = catalogSize()
  const width = String(total).length
  const hero = listOffers().find((offer) => offer.tier === 'high') ?? listOffers()[0]

  return (
    <section className="page stage-home">
      {hero && <PackVisual offerId={hero.id} size="lg" float seal="display" />}
      <div className="home-meta">
        <div className="pill">
          <span>已收录</span>
          <b>
            {String(collected).padStart(width, '0')} / {total}
          </b>
          <i />
          <span>持有卡包</span>
          <b className="gold">{packs}</b>
        </div>
        <div className="home-actions">
          {hero && (
            <button type="button" className="btn btn-ghost" onClick={() => setDetailId(hero.id)}>
              查看详情
            </button>
          )}
          <button type="button" className="btn btn-gold" onClick={() => goTo(packs > 0 ? 'rip' : 'shop')}>
            {packs > 0 ? '进入拆卡室' : '前往商店'}
          </button>
        </div>
      </div>
      {detailId && <PackDetail offerId={detailId} onClose={() => setDetailId(null)} />}
    </section>
  )
}
