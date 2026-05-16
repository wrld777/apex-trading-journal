import { useLocation } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'

const PAGE_META: Record<string, [string, string]> = {
  '/':           ['Dashboard',  'May 2025'],
  '/log-trade':  ['Log Trade',  'New Entry'],
  '/analytics':  ['Analytics',  'All Time'],
}

export default function Topbar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [title, meta] = PAGE_META[pathname] ?? ['APEX', '']

  return (
    <header className="h-[52px] bg-[#080809] border-b border-white/[0.04] flex items-center px-6 gap-4 sticky top-0 z-50">
      <span className="font-semibold text-sm text-white tracking-tight">{title}</span>
      {meta && <span className="text-[11px] text-zinc-600 before:content-['/'] before:mr-1.5 before:text-zinc-700">{meta}</span>}
      <div className="flex-1" />
      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-zinc-400 border border-white/[0.07] hover:bg-[#1a1a1d] hover:text-white transition-all">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.2"/><line x1="8" y1="8" x2="11" y2="11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
        Search
      </button>
      <button
        onClick={() => navigate('/log-trade')}
        className="px-3 py-1.5 rounded-md text-xs font-medium bg-white text-black hover:bg-white/90 transition-all"
      >
        + Log Trade
      </button>
    </header>
  )
}