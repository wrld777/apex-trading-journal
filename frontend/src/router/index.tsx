import { createBrowserRouter, isRouteErrorResponse, useRouteError } from 'react-router-dom'
import Layout from '../components/Layout'
import Dashboard from '../features/dashboard/Dashboard'
import LogTrade from '../features/log-trade/LogTrade'
import Analytics from '../features/analytics/Analytics'
import LoginPage from '../features/auth/LoginPage'
import RegisterPage from '../features/auth/RegisterPage'
import ProtectedRoute from '../components/ProtectedRoute'

function RootError() {
  const error = useRouteError()
  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <div className="min-h-screen bg-[#030304] flex items-center justify-center text-zinc-500 text-sm">
        Pagina non trovata.
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-[#030304] flex items-center justify-center text-red-400 text-sm">
      Errore inaspettato.
    </div>
  )
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
    errorElement: <RootError />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
    errorElement: <RootError />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    errorElement: <RootError />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'log-trade', element: <LogTrade /> },
      { path: 'analytics', element: <Analytics /> },
    ],
  },
])