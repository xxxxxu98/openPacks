import type {
  CardDef,
  PackOffer,
  PackSeries,
  RateTier,
  RateTierDef,
  Rarity,
} from '../types/game'

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
  N: '#a8b0be',
  R: '#79c7ff',
  SR: '#d2a6ff',
  SSR: '#f2c14e',
  SECRET: '#ff5d7a',
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

export const CARDS: readonly CardDef[] = [
  {
    id: 'c01',
    seriesId: 'core',
    no: 1,
    name: '灰烬萤',
    rarity: 'N',
    motif: 'moth',
    flavor: '灯灭之后，它仍沿着金缝飞行。',
  },
  {
    id: 'c02',
    seriesId: 'core',
    no: 2,
    name: '潮贝',
    rarity: 'N',
    motif: 'shell',
    flavor: '壳内封着一口未退的潮。',
  },
  {
    id: 'c03',
    seriesId: 'core',
    no: 3,
    name: '霜铃',
    rarity: 'N',
    motif: 'bell',
    flavor: '摇响时，空气会结一层薄霜。',
  },
  {
    id: 'c04',
    seriesId: 'core',
    no: 4,
    name: '月鹿',
    rarity: 'R',
    motif: 'stag',
    flavor: '角尖挂着没圆的月亮。',
  },
  {
    id: 'c05',
    seriesId: 'core',
    no: 5,
    name: '晶狐',
    rarity: 'R',
    motif: 'fox',
    flavor: '每一步都在地上留下棱镜。',
  },
  {
    id: 'c06',
    seriesId: 'core',
    no: 6,
    name: '岚骑',
    rarity: 'R',
    motif: 'knight',
    flavor: '甲叶里藏着没有停的雨。',
  },
  {
    id: 'c07',
    seriesId: 'core',
    no: 7,
    name: '烬凤',
    rarity: 'SR',
    motif: 'phoenix',
    flavor: '烧完一次，名字就亮一档。',
  },
  {
    id: 'c08',
    seriesId: 'core',
    no: 8,
    name: '金鸮',
    rarity: 'SR',
    motif: 'owl',
    flavor: '它看见的夜晚都镀过金。',
  },
  {
    id: 'c09',
    seriesId: 'core',
    no: 9,
    name: '日狮',
    rarity: 'SR',
    motif: 'lion',
    flavor: '鬃毛是收不拢的正午。',
  },
  {
    id: 'c10',
    seriesId: 'core',
    no: 10,
    name: '虚瞳',
    rarity: 'SSR',
    motif: 'eye',
    flavor: '被它注视的光，会忘记来处。',
  },
  {
    id: 'c11',
    seriesId: 'core',
    no: 11,
    name: '镜魇',
    rarity: 'SSR',
    motif: 'wraith',
    flavor: '你先看见它，还是它先看见你。',
  },
  {
    id: 'c12',
    seriesId: 'core',
    no: 12,
    name: '蚀冠',
    rarity: 'SECRET',
    motif: 'crown',
    flavor: '冠沿压住太阳的时候，卡面才会全息。',
  },
]

/** 一种卡包对应一套卡池。新增时在这里加一条，卡牌的 seriesId 填同一个 id。 */
export const PACK_SERIES: readonly PackSeries[] = [
  {
    id: 'core',
    name: '奇幻闪卡',
    code: 'PRISM',
    blurb: '五张都从这一套卡池里开。',
    accent: '#e4c27a',
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
