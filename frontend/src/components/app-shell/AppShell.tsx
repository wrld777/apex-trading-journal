import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { cn } from '../../design-system'

const COLLAPSED_KEY = 'rubric.sidebar.collapsed'

/**
 * Il telaio: sidebar, barra in alto, contenuto.
 *
 * La sidebar si può ridurre a sole icone e la scelta viene ricordata: su un
 * portatile da 1280px i 220px fissi si mangiavano il 17% della larghezza per
 * sette link, e chi lavora sul Trade Log — tredici colonne — quello spazio lo
 * usa per i dati.
 */
export default function AppShell() {
  // Il cassetto ricorda **su quale pagina** è stato aperto: se la pagina è
  // cambiata, è chiuso. Restare aperto sopra la pagina appena scelta è il
  // classico attrito delle navigazioni a cassetto, e questa forma lo evita
  // anche quando si naviga col tasto Indietro — che una `onClick` sui link non
  // intercetta. Prima era un `useEffect` che chiamava `setState`: un secondo
  // render a ogni cambio di rotta, per una cosa che si può derivare.
  const [drawer, setDrawer] = useState({ open: false, at: '' })
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSED_KEY) === 'true'
    } catch {
      // modalità privata o storage negato: si parte estesa, senza rompere nulla
      return false
    }
  })
  const { pathname } = useLocation()
  const drawerOpen = drawer.open && drawer.at === pathname
  const openDrawer = () => setDrawer({ open: true, at: pathname })
  const closeDrawer = () => setDrawer({ open: false, at: pathname })

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev
      try { localStorage.setItem(COLLAPSED_KEY, String(next)) } catch { /* niente da fare */ }
      return next
    })
  }

  return (
    <div className="flex min-h-screen bg-bg overflow-x-hidden">
      <Sidebar open={drawerOpen} onClose={closeDrawer} collapsed={collapsed} />

      <div
        className={cn(
          'flex flex-col flex-1 min-w-0 transition-[margin] duration-300 ease-out',
          collapsed ? 'lg:ml-[60px]' : 'lg:ml-[220px]',
        )}
      >
        <Topbar
          onMenuClick={openDrawer}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapsed}
        />
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
