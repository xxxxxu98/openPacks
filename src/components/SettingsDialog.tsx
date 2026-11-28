import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { listOffers } from '../data/catalog'
import { resetSave, toggleLighting, toggleMuted, useGameState } from '../store/useGameStore'
import type { LightingMode } from '../types/game'

type SettingsDialogProps = {
  onClose: () => void
}

/** 设置弹框：切换灯光和声音，并在这里清空存档。 */
export function SettingsDialog({ onClose }: SettingsDialogProps) {
  const state = useGameState()
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)
  const [confirm, setConfirm] = useState(false)
  const starter = listOffers()[0]

  onCloseRef.current = onClose

  useEffect(() => {
    // Esc 关闭，Tab 只在弹框内移动。
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab') return
      const root = panelRef.current
      if (!root) return
      const items = [...root.querySelectorAll<HTMLElement>('button, [href], input, select, textarea')]
        .filter((el) => !el.hasAttribute('disabled') && el.tabIndex !== -1)
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (event.shiftKey && (active === first || !root.contains(active))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  /** 切到暗房或展厅。 */
  function chooseLighting(next: LightingMode) {
    if (state.lighting === next) return
    toggleLighting()
  }

  /** 打开或关掉声效。 */
  function chooseMuted(next: boolean) {
    if (state.muted === next) return
    toggleMuted()
  }

  /** 清空进度后回到图鉴，并关上设置。 */
  function confirmReset() {
    resetSave()
    onClose()
  }

  const resetCopy = starter
    ? `清空后库存和图鉴回到最初，并赠送 1 个${starter.seriesName} · ${starter.tierName}。`
    : '清空后库存和图鉴回到最初。'

  return createPortal(
    <div className="settings" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <button type="button" className="settings-backdrop" aria-label="关闭设置" tabIndex={-1} onClick={onClose} />
      <div ref={panelRef} className="settings-panel">
        <button ref={closeRef} type="button" className="settings-close" aria-label="关闭" onClick={onClose} />
        <h2 id="settings-title">设置</h2>
        <div className="settings-row">
          <span id="settings-light">主题</span>
          <div className="settings-choice" role="group" aria-labelledby="settings-light">
            <button
              type="button"
              className={state.lighting === 'spotlight' ? 'is-on' : ''}
              aria-pressed={state.lighting === 'spotlight'}
              onClick={() => chooseLighting('spotlight')}
            >
              暗房
            </button>
            <button
              type="button"
              className={state.lighting === 'gallery' ? 'is-on' : ''}
              aria-pressed={state.lighting === 'gallery'}
              onClick={() => chooseLighting('gallery')}
            >
              展厅
            </button>
          </div>
        </div>
        <div className="settings-row">
          <span id="settings-sound">声音</span>
          <div className="settings-choice" role="group" aria-labelledby="settings-sound">
            <button type="button" className={state.muted ? '' : 'is-on'} aria-pressed={!state.muted} onClick={() => chooseMuted(false)}>
              开启
            </button>
            <button type="button" className={state.muted ? 'is-on' : ''} aria-pressed={state.muted} onClick={() => chooseMuted(true)}>
              静音
            </button>
          </div>
        </div>
        <div className="settings-reset">
          {confirm ? (
            <>
              <p>{resetCopy}</p>
              <div className="settings-actions">
                <button type="button" className="btn btn-danger" onClick={confirmReset}>
                  确认清空
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setConfirm(false)}>
                  取消
                </button>
              </div>
            </>
          ) : (
            <button type="button" className="btn btn-ghost" onClick={() => setConfirm(true)}>
              重置存档
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
