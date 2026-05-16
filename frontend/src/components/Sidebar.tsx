import { NavLink } from 'react-router-dom'

export default function Sidebar() {
  return (
    <aside className="fixed top-0 left-0 bottom-0 w-[220px] bg-[#080809] border-r border-white/[0.04] flex flex-col">
      
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/[0.04] flex items-center gap-2.5">
        <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center shrink-0">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="7" width="4" height="6" rx="1" fill="black"/>
            <rect x="5" y="4" width="4" height="9" rx="1" fill="black" opacity=".7"/>
            <rect x="9" y="1" width="4" height="12" rx="1" fill="black" opacity=".4"/>
          </svg>
        </div>
        <span className="font-bold text-[15px] tracking-widest text-white font-sans">APEX</span>
        <span className="ml-auto text-[9px] text-zinc-600 bg-[#141416] px-1.5 py-0.5 rounded border border-white/[0.07] tracking-widest uppercase">PRO</span>
      </div>

      {/* Nav */}
      <div className="p-3 flex flex-col gap-0.5 mt-2">
        <p className="text-[10px] text-zinc-700 uppercase tracking-widest px-2 pb-2">Overview</p>
        <NavLink to="/" end className={({ isActive }) =>
          `flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] transition-all border ${
            isActive
              ? 'bg-[#141416] text-white border-white/[0.07]'
              : 'text-zinc-600 border-transparent hover:bg-[#1a1a1d] hover:text-zinc-400'
          }`
        }>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2"/></svg>
          Dashboard
        </NavLink>
        <NavLink to="/analytics" className={({ isActive }) =>
          `flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] transition-all border ${
            isActive
              ? 'bg-[#141416] text-white border-white/[0.07]'
              : 'text-zinc-600 border-transparent hover:bg-[#1a1a1d] hover:text-zinc-400'
          }`
        }>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><polyline points="2,12 6,7 9,10 14,4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Analytics
        </NavLink>

        <p className="text-[10px] text-zinc-700 uppercase tracking-widest px-2 pb-2 mt-4">Trades</p>
        <NavLink to="/log-trade" className={({ isActive }) =>
          `flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] transition-all border ${
            isActive
              ? 'bg-[#141416] text-white border-white/[0.07]'
              : 'text-zinc-600 border-transparent hover:bg-[#1a1a1d] hover:text-zinc-400'
          }`
        }>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2"/><line x1="8" y1="5" x2="8" y2="11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><line x1="5" y1="8" x2="11" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
          Log Trade
        </NavLink>
      </div>

      {/* User */}
      <div className="mt-auto p-3 border-t border-white/[0.04]">
        <div className="flex items-center gap-2.5 p-2 rounded-md hover:bg-[#1a1a1d] cursor-pointer transition-all">
          <div className="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-blue-700 to-violet-700 flex items-center justify-center text-[11px] font-bold shrink-0">AB</div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-white truncate">Ahmed B.</div>
            <div className="text-[10px] text-zinc-600">NQ / NAS100</div>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"></div>
        </div>
      </div>

    </aside>
  )
}