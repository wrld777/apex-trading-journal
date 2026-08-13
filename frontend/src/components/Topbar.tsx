import { useLocation, useNavigate } from 'react-router-dom'

// Nessuna etichetta di periodo quassù: il periodo lo scelgono le pagine — il
// selettore della Dashboard, il range da/a di Analytics — e una scritta fissa
// qui finisce solo per contraddirle. "May 2025" è rimasta appesa per un anno.
const PAGE_META: Record<string, [string, string]> = {
  '/':          ['Dashboard', ''],
  '/log-trade': ['Log Trade', 'New Entry'],
  '/analytics': ['Analytics', ''],
}

interface TopbarProps {
  onMenuClick: () => void
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [title, meta] = PAGE_META[pathname] ?? ['APEX', '']

  return (
    <header className="h-[52px] bg-[#080809] border-b border-white/[0.04] flex items-center px-4 lg:px-6 gap-3 sticky top-0 z-50">

      {/* Hamburger — visible only on mobile */}
      <button
        onClick={onMenuClick}
        aria-label="Open navigation"
        className="lg:hidden bg-[#141416] border border-white/[0.07] rounded-md p-1.5 text-zinc-400 hover:text-white transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <line x1="1" y1="3"  x2="13" y2="3"  stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          <line x1="1" y1="7"  x2="13" y2="7"  stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          <line x1="1" y1="11" x2="9"  y2="11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      </button>

      <span className="font-display font-semibold text-sm text-white tracking-tight">{title}</span>
      {meta && (
        <span className="text-[11px] text-zinc-600 before:content-['/'] before:mr-1.5 before:text-zinc-700">
          {meta}
        </span>
      )}

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-zinc-400 border border-white/[0.07] hover:bg-[#1a1a1d] hover:text-white transition-all">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.2"/>
            <line x1="8" y1="8" x2="11" y2="11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          Search
        </button>
        <button
          onClick={() => navigate('/log-trade')}
          className="px-3 py-1.5 rounded-md text-xs font-medium bg-white text-black hover:bg-white/90 transition-all"
        >
          + Log Trade
        </button>
      </div>
    </header>
  )
}