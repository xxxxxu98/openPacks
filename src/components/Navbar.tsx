import type { PageId } from '../types/game'
import { countPacks, goTo, toggleLighting, toggleMuted, useGameState } from '../store/useGameStore'

const LINKS: { id: PageId; label: string }[] = [
  { id: 'home', label: '首页' },
  { id: 'shop', label: '商店' },
  { id: 'rip', label: '拆卡室' },
  { id: 'album', label: '图鉴' },
]

/** 顶部品牌、四个页面，以及无限金币和音效开关。 */
export function Navbar() {
  const state = useGameState()
  const packs = countPacks(state.inventory)

  return (
    <header className="topbar">
      <button type="button" className="brand" onClick={() => goTo('home')}>
        <span className="brand-seal" aria-hidden>
          岁
        </span>
        节气 <small>廿四</small>
      </button>
      <nav className="nav-row" aria-label="页面">
        {LINKS.map((link) => (
          <button
            key={link.id}
            type="button"
            className={`nav-btn${state.page === link.id ? ' is-on' : ''}`}
            aria-current={state.page === link.id ? 'page' : undefined}
            onClick={() => goTo(link.id)}
          >
            {link.label}
            {link.id === 'rip' && packs > 0 && <em className="badge">{packs}</em>}
          </button>
        ))}
      </nav>
      <div className="topbar-stats">
        <span className="hud" aria-label="金币无限">
          <i className="coin" />∞
        </span>
        <button type="button" className="hud-btn" aria-pressed={state.lighting === 'gallery'} onClick={toggleLighting}>
          {state.lighting === 'spotlight' ? '暗房' : '展厅'}
        </button>
        <button type="button" className="hud-btn" aria-pressed={state.muted} onClick={toggleMuted}>
          {state.muted ? '静音' : '声效'}
        </button>
      </div>
    </header>
  )
}
