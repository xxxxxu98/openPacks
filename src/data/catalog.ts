import type {
  CardDef,
  PackOffer,
  PackSeries,
  RateTier,
  RateTierDef,
  Rarity,
} from '../types/game'
import { SOLAR_CARDS } from './solarTerms'

export const SUPPLY_COINS = 500
export const START_COINS = 200
export const PACK_CARD_COUNT = 5

export const RARITY_RANK: Record<Rarity, number> = {
  N: 0,
  R: 1,
  SR: 2,
  SSR: 3,
  SECRET: 4,
}

export const RARITY_LABEL: Record<Rarity, string> = {
  N: '普通',
  R: '稀有',
  SR: '超稀有',
  SSR: '特级',
  SECRET: '秘藏',
}

export const RARITY_TONE: Record<Rarity, string> = {
  N: '#b7aea2',
  R: '#7eb6de',
  SR: '#5dccb0',
  SSR: '#f0d48a',
  SECRET: '#d7c4ef',
}

export const SALVAGE: Record<Rarity, number> = {
  N: 20,
  R: 60,
  SR: 160,
  SSR: 420,
  SECRET: 1000,
}

/** 各购买档共用的稀有度权重。 */
export const BASE_WEIGHTS: Record<Rarity, number> = {
  N: 46,
  R: 30,
  SR: 16,
  SSR: 7,
  SECRET: 1,
}

export const CARDS: readonly CardDef[] = SOLAR_CARDS

/** 在售卡包。新增时加一条，卡牌的 seriesId 填同一个 id。 */
export const PACK_SERIES: readonly PackSeries[] = [
  {
    id: 'solar',
    name: '二十四节气',
    code: '廿四',
    blurb: '从二十四张里开出五张。',
    accent: '#8e3a38',
    crest: 'planet',
  },
]

/** 购买档位。低爆无保底，中爆至少一张超稀有，高爆至少一张特级。 */
export const RATE_TIERS: readonly RateTierDef[] = [
  {
    id: 'low',
    name: '低爆',
    floor: null,
    theme: 'standard',
    edition: '低爆',
    blurb: '按基础爆率开，没有保底。',
  },
  {
    id: 'mid',
    name: '中爆',
    floor: 'SR',
    theme: 'nebula',
    edition: '中爆',
    blurb: '这一包至少有一张 SR、SSR 或 SECRET。',
  },
  {
    id: 'high',
    name: '高爆',
    floor: 'SSR',
    theme: 'prism',
    edition: '高爆',
    blurb: '这一包至少有一张 SSR 或 SECRET。',
  },
]

const CARD_INDEX = new Map(CARDS.map((card) => [card.id, card]))

export function catalogSize() {
  return CARDS.length
}

/** 库存键：卡包 id 加购买档。 */
export function offerId(seriesId: string, tier: RateTier) {
  return `${seriesId}:${tier}`
}

/** 卡号按所属卡包计数。 */
export function formatSerial(card: CardDef) {
  const size = cardsOfSeries(card.seriesId).length
  return `NO. ${String(card.no).padStart(3, '0')} / ${String(size).padStart(3, '0')}`
}

export function getCard(id: string) {
  const card = CARD_INDEX.get(id)
  if (!card) throw new Error(`未知卡牌 ${id}`)
  return card
}

/** 某一套卡包里的卡。 */
export function cardsOfSeries(seriesId: string) {
  return CARDS.filter((card) => card.seriesId === seriesId)
}

function toOffer(series: PackSeries, tier: RateTierDef): PackOffer {
  return {
    id: offerId(series.id, tier.id),
    seriesId: series.id,
    tier: tier.id,
    seriesName: series.name,
    tierName: tier.name,
    code: series.code,
    cardCount: PACK_CARD_COUNT,
    floor: tier.floor,
    blurb: tier.blurb,
    accent: series.accent,
    crest: series.crest,
    theme: tier.theme,
    edition: tier.edition,
  }
}

/** 这一档的保底在该卡池里做得到才上架。 */
function tierAvailable(seriesId: string, tier: RateTierDef) {
  const cards = cardsOfSeries(seriesId)
  if (cards.length === 0) return false
  if (!tier.floor) return true
  const floor = tier.floor
  return cards.some((card) => RARITY_RANK[card.rarity] >= RARITY_RANK[floor])
}

export function listOffers(seriesId?: string) {
  return PACK_SERIES.filter((series) => (seriesId ? series.id === seriesId : true)).flatMap((series) =>
    RATE_TIERS.filter((tier) => tierAvailable(series.id, tier)).map((tier) => toOffer(series, tier)),
  )
}

export function getOffer(id: string) {
  const offer = listOffers().find((item) => item.id === id)
  if (!offer) throw new Error(`未知卡包 ${id}`)
  return offer
}
