import { useSyncExternalStore } from 'react'
import { sound } from '../audio/soundEngine'
import { CARDS, PACK_SERIES, SALVAGE, START_COINS, formatSerial, getCard, getOffer, listOffers, offerId } from '../data/catalog'
import type {
  CardDef,
  DrawnCard,
  GameState,
  LightingMode,
  OwnedMap,
  PackInventory,
  PageId,
  PersistedState,
  RateTier,
} from '../types/game'

const SAVE_KEY = 'simplemkt.save.v1'
const LEGACY_TIER: Record<string, RateTier> = {
  standard: 'low',
  holo: 'mid',
  vault: 'high',
}
const KNOWN_CARDS = new Set(CARDS.map((card) => card.id))

function blankInventory(): PackInventory {
  const inventory: PackInventory = {}
  for (const offer of listOffers()) inventory[offer.id] = 0
  return inventory
}

function emptyInventory(): PackInventory {
  const inventory = blankInventory()
  const starter = listOffers()[0]
  if (starter) inventory[starter.id] = 1
  return inventory
}

/** 把存档库存收成当前卡包档位，旧的三档并入第一种卡包。 */
function readInventory(raw: unknown): PackInventory {
  const inventory = blankInventory()
  if (!raw || typeof raw !== 'object') return inventory
  const firstSeries = PACK_SERIES[0]?.id ?? ''
  for (const [key, value] of Object.entries(raw)) {
    const count = whole(value, 0)
    if (count <= 0) continue
    const legacy = LEGACY_TIER[key]
    const id = legacy ? offerId(firstSeries, legacy) : key
    if (!(id in inventory)) continue
    inventory[id] += count
  }
  return inventory
}

function createDefault(): GameState {
  return {
    coins: START_COINS,
    inventory: emptyInventory(),
    owned: {},
    opens: 0,
    muted: false,
    lighting: 'spotlight',
    page: 'home',
    ripPackId: listOffers()[0]?.id ?? '',
    ripToken: 0,
  }
}

function whole(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : fallback
}

/** 读本地存档，缺字段或类型不对时回到新玩家赠礼。 */
function readSave(): GameState {
  const base = createDefault()
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return base
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return base
    const data = parsed as Partial<PersistedState>
    const inventory = readInventory(data.inventory)
    const owned: OwnedMap = {}
    if (data.owned && typeof data.owned === 'object') {
      for (const [id, count] of Object.entries(data.owned)) {
        if (!KNOWN_CARDS.has(id)) continue
        const next = whole(count, 0)
        if (next > 0) owned[id] = next
      }
    }
    const lighting: LightingMode = data.lighting === 'gallery' ? 'gallery' : 'spotlight'
    return {
      ...base,
      coins: whole(data.coins, base.coins),
      inventory,
      owned,
      opens: whole(data.opens, 0),
      muted: data.muted === true,
      lighting,
    }
  } catch {
    return base
  }
}

function persistedOf(next: GameState): PersistedState {
  return {
    coins: next.coins,
    inventory: next.inventory,
    owned: next.owned,
    opens: next.opens,
    muted: next.muted,
    lighting: next.lighting,
  }
}

function writeSave(next: GameState) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(persistedOf(next)))
  } catch {
    return
  }
}

let state = readSave()
sound.setMuted(state.muted)

const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

function patch(partial: Partial<GameState>, save = true) {
  state = { ...state, ...partial }
  if (save) writeSave(state)
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return state
}

export function getState() {
  return state
}

export function useGameState() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

export function countPacks(inventory: PackInventory) {
  return Object.values(inventory).reduce((sum, count) => sum + count, 0)
}

export function countCollected(owned: OwnedMap) {
  return CARDS.reduce((sum, card) => sum + ((owned[card.id] ?? 0) > 0 ? 1 : 0), 0)
}

export function goTo(page: PageId) {
  if (state.page === page) return
  sound.click()
  patch({ page }, false)
}

/** 买下某一类卡包的某一爆率档。金币无限，只增加对应库存。 */
export function buyPack(id: string) {
  getOffer(id)
  patch({
    inventory: { ...state.inventory, [id]: (state.inventory[id] ?? 0) + 1 },
  })
  sound.coin()
  return true
}

/** 带上刚买或库存里的某一档，进入拆卡室并只自动开一次。 */
export function openRip(id: string) {
  sound.click()
  patch({ page: 'rip', ripPackId: id, ripToken: state.ripToken + 1 }, false)
}

export function consumeRipToken() {
  if (state.ripToken === 0) return
  patch({ ripToken: 0 }, false)
}

/** 撕开完成后才扣库存并把卡写入图鉴，同一张在本包里只有第一张算新。 */
export function commitOpen(packId: string, cards: readonly CardDef[]): DrawnCard[] {
  if ((state.inventory[packId] ?? 0) <= 0) return []
  const owned = { ...state.owned }
  const drawn: DrawnCard[] = cards.map((card) => {
    const previous = owned[card.id] ?? 0
    owned[card.id] = previous + 1
    return {
      instanceId: crypto.randomUUID(),
      cardId: card.id,
      isNew: previous === 0,
      serial: formatSerial(card),
    }
  })
  patch({
    inventory: { ...state.inventory, [packId]: state.inventory[packId] - 1 },
    owned,
    opens: state.opens + 1,
  })
  return drawn
}

/** 分解一张重复卡，换回该稀有度对应的金币。 */
export function salvageCard(cardId: string) {
  const count = state.owned[cardId] ?? 0
  if (count <= 1) return 0
  const card = getCard(cardId)
  const gain = SALVAGE[card.rarity]
  patch({
    owned: { ...state.owned, [cardId]: count - 1 },
    coins: state.coins + gain,
  })
  sound.coin()
  return gain
}

export function toggleMuted() {
  const muted = !state.muted
  sound.setMuted(muted)
  patch({ muted })
  if (!muted) sound.click()
}

export function toggleLighting() {
  sound.click()
  patch({ lighting: state.lighting === 'spotlight' ? 'gallery' : 'spotlight' })
}

/** 清空本地进度，回到赠礼后的图鉴页。 */
export function resetSave() {
  state = { ...createDefault(), page: 'album' }
  sound.setMuted(false)
  writeSave(state)
  emit()
}
