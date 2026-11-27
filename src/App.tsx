import { useEffect } from 'react'
import { sound } from './audio/soundEngine'
import { Atmosphere } from './components/Atmosphere'
import { Navbar } from './components/Navbar'
import { AlbumPage } from './pages/AlbumPage'
import { HomePage } from './pages/HomePage'
import { RipPage } from './pages/RipPage'
import { ShopPage } from './pages/ShopPage'
import { useGameState } from './store/useGameStore'

export function App() {
  const { page, lighting } = useGameState()

  useEffect(() => {
    const unlock = () => sound.unlock()
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  return (
    <div className="app-root" data-light={lighting}>
      <Atmosphere />
      <div className="app-ui">
        <a className="skip" href="#main">
          跳到内容
        </a>
        <Navbar />
        <main id="main" key={page} className="view-animate-in">
          {page === 'home' && <HomePage />}
          {page === 'shop' && <ShopPage />}
          {page === 'rip' && <RipPage />}
          {page === 'album' && <AlbumPage />}
        </main>
      </div>
    </div>
  )
}
