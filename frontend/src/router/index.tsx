import { createBrowserRouter } from 'react-router-dom'
import Layout from '../components/Layout.tsx'
import Dashboard from '../features/dashboard/Dashboard.tsx'
import LogTrade from '../features/log-trade/LogTrade.tsx'
import Analytics from '../features/analytics/Analytics.tsx'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'log-trade', element: <LogTrade /> },
      { path: 'analytics', element: <Analytics /> },
    ],
  },
])