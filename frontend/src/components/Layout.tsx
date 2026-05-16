import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-[#030304]">
      <Sidebar />
      <div className="flex flex-col flex-1 ml-[220px]">
        <Topbar />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}