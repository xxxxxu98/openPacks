import { BASE_WEIGHTS, RARITY_RANK, cardsOfSeries } from './catalog'
import type { CardDef, PackOffer, Rarity } from '../types/game'

const RARITY_ORDER: readonly Rarity[] = ['N', 'R', 'SR', 'SSR', 'SECRET']

/** 按权重抽一个稀有度；传入限制时只在该集合里重新归一。 */
export function rollRarity(
  weights: Record<Rarity, number>,
  rng: () => number,
  allow?: readonly Rarity[],
): Rarity {
  const entries = RARITY_ORDER.filter((rarity) => !allow || allow.includes(rarity)).map(
    (rarity) => [rarity, weights[rarity]] as const,
  )
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0)
  let ticket = rng() * (total || 1)
  for (const [rarity, weight] of entries) {
    ticket -= weight
    if (ticket <= 0) return rarity
  }
  return entries[entries.length - 1]?.[0] ?? 'N'
}

function presentRarities(cards: readonly CardDef[]) {
  return RARITY_ORDER.filter((rarity) => cards.some((card) => card.rarity === rarity))
}

function raritiesAtLeast(floor: Rarity) {
  return RARITY_ORDER.filter((rarity) => RARITY_RANK[rarity] >= RARITY_RANK[floor])
}

/** 只在这个卡池里、且稀有度允许的卡中抽一张。 */
function pickFrom(
  cards: readonly CardDef[],
  rng: () => number,
  allow?: readonly Rarity[],
) {
  const present = presentRarities(cards)
  const usable = allow ? present.filter((rarity) => allow.includes(rarity)) : present
  if (usable.length === 0) return undefined
  const rarity = rollRarity(BASE_WEIGHTS, rng, usable)
  const pool = cards.filter((card) => card.rarity === rarity)
  if (pool.length === 0) return undefined
  return pool[Math.floor(rng() * pool.length)]
}

/** 这一包里没有达到保底的卡时，把稀有度最低的一张改成保底档。 */
function applyFloor(drawn: CardDef[], pool: readonly CardDef[], floor: Rarity | null, rng: () => number) {
  if (!floor || drawn.length === 0) return drawn
  if (drawn.some((card) => RARITY_RANK[card.rarity] >= RARITY_RANK[floor])) return drawn
  const hit = pickFrom(pool, rng, raritiesAtLeast(floor))
  if (!hit) return drawn
  let lowest = 0
  for (let index = 1; index < drawn.length; index += 1) {
    if (RARITY_RANK[drawn[index].rarity] < RARITY_RANK[drawn[lowest].rarity]) lowest = index
  }
  const next = drawn.slice()
  next[lowest] = hit
  return next
}

/** 从该卡包自己的卡池抽满，不够保底时换掉其中最低的一张。 */
export function rollPack(offer: PackOffer, rng: () => number = Math.random): CardDef[] {
  const pool = cardsOfSeries(offer.seriesId)
  const drawn: CardDef[] = []
  for (let index = 0; index < offer.cardCount; index += 1) {
    const card = pickFrom(pool, rng)
    if (card) drawn.push(card)
  }
  return applyFloor(drawn, pool, offer.floor, rng)
}

/** 取这一包里最高的稀有度，供摇包时的封边光晕使用。 */
export function bestRarity(cards: readonly CardDef[]): Rarity {
  let best: Rarity = 'N'
  for (const card of cards) {
    if (RARITY_RANK[card.rarity] > RARITY_RANK[best]) best = card.rarity
  }
  return best
}
