/* eslint-disable react-refresh/only-export-components --
   Questo modulo esporta la tabella delle rotte, che non è un componente, e
   accanto definisce i caricamenti pigri, che lo sembrano. È esattamente la
   forma che la regola vieta, e qui non c'è un'alternativa sensata: separare i
   `lazy` in un altro file darebbe un secondo modulo che esporta non-componenti,
   spostando il problema di un file. */
import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'

import AppShell from '../components/app-shell/AppShell'
import ProtectedRoute from '../components/ProtectedRoute'
import RootError from '../components/RootError'
import { Skeleton } from '../design-system'

/**
 * Le rotte, e il punto in cui il codice si divide.
 *
 * Tutto stava in un pacchetto solo da 507 KB: chi apriva la Dashboard scaricava
 * anche il modulo di registrazione trade, la pagina Strategie e le sue modali —
 * roba che magari non aprirà mai in quella sessione. `lazy` fa sì che ogni
 * pagina arrivi quando serve.
 *
 * Il telaio (`AppShell`, sidebar, topbar) resta nel pacchetto principale, e non
 * per dimenticanza: si vede subito, su ogni rotta, ed è l'unica cosa che non
 * ha senso far aspettare.
 */

const Dashboard = lazy(() => import('../features/dashboard/Dashboard'))
const LogTrade = lazy(() => import('../features/log-trade/LogTrade'))
const Analytics = lazy(() => import('../features/analytics/Analytics'))
const StrategyAnalytics = lazy(() => import('../features/strategy-analytics/StrategyAnalytics'))
const TradeLog = lazy(() => import('../features/trade-log/TradeLog'))
const TradeDetail = lazy(() => import('../features/trade-log/TradeDetail'))
const EditTrade = lazy(() => import('../features/trade-log/EditTrade'))
const Strategies = lazy(() => import('../features/strategies/Strategies'))
const Profile = lazy(() => import('../features/profile/Profile'))
const LoginPage = lazy(() => import('../features/auth/LoginPage'))
const RegisterPage = lazy(() => import('../features/auth/RegisterPage'))

/**
 * L'attesa mentre arriva una pagina.
 *
 * Ha la forma di un'intestazione più contenuto, cioè quello che sta per
 * comparire davvero: uno spinner al centro dello schermo farebbe saltare il
 * layout nel momento in cui la pagina si monta.
 */
function PageFallback() {
  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-52" />
        <Skeleton className="h-3 w-72" />
      </div>
      <Skeleton className="h-40 w-full rounded-lg" />
    </div>
  )
}

/** Ogni pagina arriva dentro la sua attesa. */
const page = (element: React.ReactNode) => <Suspense fallback={<PageFallback />}>{element}</Suspense>

export const router = createBrowserRouter([
  {
    path: '/login',
    element: page(<LoginPage />),
    errorElement: <RootError />,
  },
  {
    path: '/register',
    element: page(<RegisterPage />),
    errorElement: <RootError />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    errorElement: <RootError />,
    children: [
      { index: true, element: page(<Dashboard />) },
      { path: 'log-trade', element: page(<LogTrade />) },
      { path: 'trades', element: page(<TradeLog />) },
      { path: 'trades/:id', element: page(<TradeDetail />) },
      { path: 'trades/:id/edit', element: page(<EditTrade />) },
      { path: 'strategies', element: page(<Strategies />) },
      { path: 'strategy-insights', element: page(<StrategyAnalytics />) },
      { path: 'analytics', element: page(<Analytics />) },
      { path: 'profile', element: page(<Profile />) },
    ],
  },
  // Qualunque altro indirizzo. Senza questa voce il 404 dipende da quale rotta
  // React Router considera la radice, e con tre rotte di primo livello non è
  // una cosa su cui valga la pena scommettere.
  { path: '*', element: <RootError /> },
])
