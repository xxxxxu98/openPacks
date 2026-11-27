export type PageId = 'home' | 'shop' | 'rip' | 'album'

export type Rarity = 'N' | 'R' | 'SR' | 'SSR' | 'SECRET'

export type MotifKind =
  | 'moth'
  | 'shell'
  | 'bell'
  | 'stag'
  | 'fox'
  | 'knight'
  | 'phoenix'
  | 'owl'
  | 'lion'
  | 'eye'
  | 'wraith'
  | 'crown'

export type RateTier = 'low' | 'mid' | 'high'

export type PackCrest = 'planet' | 'torus' | 'plus'

export type PackTheme = 'standard' | 'nebula' | 'prism'

export type LightingMode = 'spotlight' | 'gallery'

export type RarityFilter = 'ALL' | Rarity

export interface CardDef {
  id: string
  seriesId: string
  no: number
  name: string
  rarity: Rarity
  motif: MotifKind
  flavor: string
}

export interface DrawnCard {
  instanceId: string
  cardId: string
  isNew: boolean
  serial: string
}

export interface PackSeries {
  id: string
  name: string
  code: string
  blurb: string
  accent: string
  crest: PackCrest
}

export interface RateTierDef {
  id: RateTier
  name: string
  floor: Rarity | null
  theme: PackTheme
  edition: string
  blurb: string
}

export interface PackOffer {
  id: string
  seriesId: string
  tier: RateTier
  seriesName: string
  tierName: string
  code: string
  cardCount: number
  floor: Rarity | null
  blurb: string
  accent: string
  crest: PackCrest
  theme: PackTheme
  edition: string
}

export type PackInventory = Record<string, number>

export type OwnedMap = Record<string, number>

export interface PersistedState {
  coins: number
  inventory: PackInventory
  owned: OwnedMap
  opens: number
  muted: boolean
  lighting: LightingMode
}

export interface GameState extends PersistedState {
  page: PageId
  ripPackId: string
  ripToken: number
}
