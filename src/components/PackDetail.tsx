import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { RARITY_RANK, cardsOfSeries, getCard, getOffer } from '../data/catalog'
import { CardInspect } from './CardInspect'
import { CardVisual } from './CardVisual'
import { PackVisual } from './PackVisual'

type PackDetailProps = {
  offerId: string
  onClose: () => void
}

/** 卡包详情。列出这一档卡池里的全部卡片，点开一张可检视。 */
export function PackDetail({ offerId, onClose }: PackDetailProps) {
  const offer = getOffer(offerId)
  // 详情按品级从低到高排，同级仍按节气顺序。
  const cards = cardsOfSeries(offer.seriesId).slice().sort(
    (a, b) => RARITY_RANK[a.rarity] - RARITY_RANK[b.rarity] || a.no - b.no,
  )
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
        <button ref={closeRef} type="button" className="inspect-close" onClick={onClose}>
          ✕
        </button>
        <header className="pack-detail-head">
          <div className="pack-detail-pack">
            <PackVisual offerId={offer.id} seal="display" />
          </div>
          <div className="pack-detail-copy">
            <h2>{offer.seriesName}</h2>
            <p>
              {offer.tierName} · 每包开出 {offer.cardCount} 张
            </p>
            <p>{offer.blurb}</p>
            <p>卡池 {cards.length} 张</p>
          </div>
        </header>
        <div className="pack-detail-grid">
          {cards.map((card) => (
            <button key={card.id} type="button" className="slot-owned" onClick={() => setActiveId(card.id)}>
              <CardVisual card={card} size="sm" />
            </button>
          ))}
        </div>
      </div>
      {active && <CardInspect card={active} onClose={() => setActiveId(null)} />}
    </div>,
    document.body,
  )
}
