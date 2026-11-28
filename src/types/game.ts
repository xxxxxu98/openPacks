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

export type SeasonName = 'spring' | 'summer' | 'autumn' | 'winter'

export type SolarScene =
  | 'lichun'
  | 'yushui'
  | 'jingzhe'
  | 'chunfen'
  | 'qingming'
  | 'guyu'
  | 'lixia'
  | 'xiaoman'
  | 'mangzhong'
  | 'xiazhi'
  | 'xiaoshu'
  | 'dashu'
  | 'liqiu'
  | 'chushu'
  | 'bailu'
  | 'qiufen'
  | 'hanlu'
  | 'shuangjiang'
  | 'lidong'
  | 'xiaoxue'
  | 'daxue'
  | 'dongzhi'
  | 'xiaohan'
  | 'dahan'

export type RateTier = 'low' | 'mid' | 'high'

export type PackCrest = 'planet' | 'torus' | 'plus'

export type PackTheme = 'standard' | 'nebula' | 'prism'

export type LightingMode = 'spotlight' | 'gallery'

export type RarityFilter = 'ALL' | Rarity

interface CardBase {
  id: string
  seriesId: string
  no: number
  name: string
  rarity: Rarity
  verse: string
  flavor: string
}

/** 节气册页。画心只占中间，题款印在纸上。 */
export interface LeafCard extends CardBase {
  face?: 'leaf'
  season: SeasonName
  scene: SolarScene
  phenology: readonly [string, string, string]
  span: string
}

/** 画心卡。整张图是画面，卡名和题款印在下沿。 */
export interface PlateCard extends CardBase {
  face: 'plate'
  art: string
  notes: readonly [string, string, string]
}

export type CardDef = LeafCard | PlateCard

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
  /** 这一套的印，一个字，盖在卡背和封上。 */
  mark: string
  blurb: string
  accent: string
  crest: PackCrest
  /** 箔封中间的封面，指向这一套里的一张画。节气册页不用。 */
  cover?: string
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
  mark: string
  cardCount: number
  floor: Rarity | null
  blurb: string
  accent: string
  crest: PackCrest
  theme: PackTheme
  edition: string
  cover?: string
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
