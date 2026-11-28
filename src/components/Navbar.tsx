import { useRef, useState } from 'react'
import { BRAND_NAME } from '../data/catalog'
import type { PageId } from '../types/game'
import { countPacks, goTo, useGameState } from '../store/useGameStore'
import { SettingsDialog } from './SettingsDialog'

const LINKS: { id: PageId; label: string }[] = [
  { id: 'home', label: '首页' },
  { id: 'shop', label: '商店' },
  { id: 'rip', label: '拆卡室' },
  { id: 'album', label: '图鉴' },
]

/** 固定在视口顶部的品牌、页面入口、金币和设置。 */
export function Navbar() {
  const state = useGameState()
  const packs = countPacks(state.inventory)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsRef = useRef<HTMLButtonElement>(null)

  /** 关上设置后，焦点回到右上角的图标。 */
  function closeSettings() {
    setSettingsOpen(false)
    settingsRef.current?.focus()
  }

  return (
    <header className="topbar-shell">
      <div className="topbar">
        <button type="button" className="brand" onClick={() => goTo('home')}>
          <span className="brand-seal" aria-hidden>
            <img src="/brand-seal.png" alt="" />
          </span>
          {BRAND_NAME}
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
          <button
            ref={settingsRef}
            type="button"
            className="hud-btn settings-btn"
            aria-label="设置"
            aria-haspopup="dialog"
            aria-expanded={settingsOpen}
            onClick={() => setSettingsOpen(true)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.3 3.6h3.4l.5 2.1a6.8 6.8 0 0 1 1.7 1l2-.8 1.7 2.9-1.5 1.5a6.9 6.9 0 0 1 0 2l1.5 1.5-1.7 2.9-2-.8a6.8 6.8 0 0 1-1.7 1l-.5 2.1h-3.4l-.5-2.1a6.8 6.8 0 0 1-1.7-1l-2 .8-1.7-2.9 1.5-1.5a6.9 6.9 0 0 1 0-2L4.4 8.8l1.7-2.9 2 .8a6.8 6.8 0 0 1 1.7-1l.5-2.1Z" />
              <circle cx="12" cy="12" r="2.4" />
            </svg>
          </button>
        </div>
      </div>
      {settingsOpen && <SettingsDialog onClose={closeSettings} />}
    </header>
  )
}
