import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { BASE_WEIGHTS, RARITY_LABEL, RARITY_RANK, RARITY_TONE, cardsOfSeries, getCard, getOffer } from '../data/catalog'
import type { CardDef, Rarity } from '../types/game'
import { CardInspect } from './CardInspect'
import { CardVisual } from './CardVisual'
import { PackVisual } from './PackVisual'

const RARITIES: readonly Rarity[] = ['N', 'R', 'SR', 'SSR', 'SECRET']

type PackDetailProps = {
  offerId: string
  onClose: () => void
}

type PoolGroup = {
  rarity: Rarity
  cards: CardDef[]
}

/** 卡池按品级分成几段，同级保持节气顺序。 */
function poolGroups(cards: readonly CardDef[]) {
  const groups: PoolGroup[] = []
  for (const card of cards) {
    const last = groups[groups.length - 1]
    if (!last || last.rarity !== card.rarity) groups.push({ rarity: card.rarity, cards: [card] })
    else last.cards.push(card)
  }
  return groups
}

/** 卡包详情。按品级列出这一档卡池，点开一张可检视。 */
export function PackDetail({ offerId, onClose }: PackDetailProps) {
  const offer = getOffer(offerId)
  // 详情按品级从低到高排，同级仍按节气顺序。
  const cards = cardsOfSeries(offer.seriesId).slice().sort(
    (a, b) => RARITY_RANK[a.rarity] - RARITY_RANK[b.rarity] || a.no - b.no,
  )
  const groups = poolGroups(cards)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const active = activeId ? getCard(activeId) : null

  useEffect(() => {
    closeRef.current?.focus()
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  useEffect(() => {
    // 单卡检视自己处理 Esc，这里只在卡池层关闭。
    if (activeId) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeId, onClose])

  return createPortal(
    <div className="inspect pack-detail" role="dialog" aria-modal="true" aria-label={`${offer.seriesName} ${offer.tierName} 详情`}>
      <button type="button" className="inspect-backdrop" aria-label="关闭详情" tabIndex={-1} onClick={onClose} />
      <div className="pack-detail-panel">
        <button ref={closeRef} type="button" className="inspect-close" aria-label="关闭" onClick={onClose} />
        <header className="pack-detail-head">
          <div className="pack-detail-pack">
            <PackVisual offerId={offer.id} seal="display" />
          </div>
          <div className="pack-detail-copy">
            <h2>{offer.seriesName}</h2>
            <p className="pack-detail-line">
              <span>{offer.tierName}</span>
              <i aria-hidden="true" />
              <span>每包 {offer.cardCount} 张</span>
              <i aria-hidden="true" />
              <span>卡池 {cards.length} 张</span>
            </p>
            <p className="pack-detail-blurb">{offer.blurb}</p>
            <div className="pack-detail-rates">
              <div className="weights" aria-hidden>
                {RARITIES.map((rarity) => (
                  <i key={rarity} style={{ flexGrow: BASE_WEIGHTS[rarity], background: RARITY_TONE[rarity] }} />
                ))}
              </div>
              <p className="weight-legend">
                {RARITIES.map((rarity) => `${RARITY_LABEL[rarity]} ${BASE_WEIGHTS[rarity]}`).join(' · ')}
              </p>
            </div>
          </div>
        </header>
        <div className="pack-detail-pool">
          {groups.map((group) => (
            <section key={group.rarity} className="pack-detail-group">
              <h3>
                <b aria-hidden style={{ background: RARITY_TONE[group.rarity] }} />
                {RARITY_LABEL[group.rarity]}
                <span>{group.cards.length} 张</span>
              </h3>
              <div className="pack-detail-grid">
                {group.cards.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    className="pack-detail-card"
                    aria-label={`${card.name}，${RARITY_LABEL[card.rarity]}`}
                    onClick={() => setActiveId(card.id)}
                  >
                    <CardVisual card={card} size="sm" />
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
      {active && <CardInspect card={active} onClose={() => setActiveId(null)} />}
    </div>,
    document.body,
  )
}
