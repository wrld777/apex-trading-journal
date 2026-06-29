import { createBrowserRouter } from 'react-router-dom'
import Layout from '../components/Layout'
import Dashboard from '../features/dashboard/Dashboard'
import LogTrade from '../features/log-trade/LogTrade'
import Analytics from '../features/analytics/Analytics'
import TradeLog from '../features/trade-log/TradeLog'
import Profile from '../features/profile/Profile'
import LoginPage from '../features/auth/LoginPage'
import RegisterPage from '../features/auth/RegisterPage'
import ProtectedRoute from '../components/ProtectedRoute'
import RootError from '../components/RootError'

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
      { path: 'trades', element: <TradeLog /> },
      { path: 'analytics', element: <Analytics /> },
      { path: 'profile', element: <Profile /> },
    ],
  },
])