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
        <svg viewBox="0 0 32 32" aria-hidden>
          <path d="M16 3C16 10.5 21.5 16 29 16C21.5 16 16 21.5 16 29C16 21.5 10.5 16 3 16C10.5 16 16 10.5 16 3Z" fill="url(#brandGrad)" />
          <defs>
            <linearGradient id="brandGrad" x1="3" y1="3" x2="29" y2="29">
              <stop stopColor="#FDE047" />
              <stop offset="0.5" stopColor="#38BDF8" />
              <stop offset="1" stopColor="#F472B6" />
            </linearGradient>
          </defs>
        </svg>
        PRISM <small>// 01</small>
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
