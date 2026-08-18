import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useProfile } from '../hooks/useProfile'
import { t } from '../i18n'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

function initials(name: string | null): string {
  if (!name) return 'AB'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'AB'
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const name = useAuthStore((s) => s.name)
  const { data: profile } = useProfile()

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99] lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 left-0 bottom-0 w-[220px] bg-[#080809] border-r border-white/[0.04] flex flex-col z-[100]
        transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>

        {/* Logo */}
        <div className="px-5 py-6 border-b border-white/[0.04] flex items-center gap-2.5">
          <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="7" width="4" height="6" rx="1" fill="black"/>
              <rect x="5" y="4" width="4" height="9" rx="1" fill="black" opacity=".7"/>
              <rect x="9" y="1" width="4" height="12" rx="1" fill="black" opacity=".4"/>
            </svg>
          </div>
          <span className="font-display font-bold text-[15px] tracking-widest text-white">{t('brand.name')}</span>
          <span className="ml-auto text-[9px] text-zinc-600 bg-[#141416] px-1.5 py-0.5 rounded border border-white/[0.07] tracking-widest uppercase">PRO</span>
        </div>

        {/* Nav */}
        <div className="p-3 flex flex-col gap-0.5 mt-2">
          <p className="text-[10px] text-zinc-700 uppercase tracking-widest px-2 pb-2">{t('nav.overview')}</p>

          <NavLink to="/" end onClick={onClose} className={({ isActive }) =>
            `flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] transition-all border ${
              isActive
                ? 'bg-[#141416] text-white border-white/[0.07]'
                : 'text-zinc-600 border-transparent hover:bg-[#1a1a1d] hover:text-zinc-400'
            }`
          }>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
              <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
              <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
              <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
            {t('nav.dashboard')}
          </NavLink>

          <NavLink to="/analytics" onClick={onClose} className={({ isActive }) =>
            `flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] transition-all border ${
              isActive
                ? 'bg-[#141416] text-white border-white/[0.07]'
                : 'text-zinc-600 border-transparent hover:bg-[#1a1a1d] hover:text-zinc-400'
            }`
          }>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <polyline points="2,12 6,7 9,10 14,4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {t('nav.analytics')}
          </NavLink>

          <p className="text-[10px] text-zinc-700 uppercase tracking-widest px-2 pb-2 mt-4">{t('nav.trades')}</p>

          <NavLink to="/log-trade" onClick={onClose} className={({ isActive }) =>
            `flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] transition-all border ${
              isActive
                ? 'bg-[#141416] text-white border-white/[0.07]'
                : 'text-zinc-600 border-transparent hover:bg-[#1a1a1d] hover:text-zinc-400'
            }`
          }>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2"/>
              <line x1="8" y1="5" x2="8" y2="11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <line x1="5" y1="8" x2="11" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            {t('nav.logTrade')}
          </NavLink>

          <NavLink to="/trades" onClick={onClose} className={({ isActive }) =>
            `flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] transition-all border ${
              isActive
                ? 'bg-[#141416] text-white border-white/[0.07]'
                : 'text-zinc-600 border-transparent hover:bg-[#1a1a1d] hover:text-zinc-400'
            }`
          }>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <line x1="2" y1="4" x2="14" y2="4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <line x1="2" y1="12" x2="14" y2="12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            {t('nav.tradeLog')}
          </NavLink>

          <NavLink to="/strategies" onClick={onClose} className={({ isActive }) =>
            `flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] transition-all border ${
              isActive
                ? 'bg-[#141416] text-white border-white/[0.07]'
                : 'text-zinc-600 border-transparent hover:bg-[#1a1a1d] hover:text-zinc-400'
            }`
          }>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M3 4h10M3 8h10M3 12h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <path d="M12.5 11l1.2 1.2 2-2.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {t('nav.strategies')}
          </NavLink>

          <NavLink to="/strategy-insights" onClick={onClose} className={({ isActive }) =>
            `flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] transition-all border ${
              isActive
                ? 'bg-[#141416] text-white border-white/[0.07]'
                : 'text-zinc-600 border-transparent hover:bg-[#1a1a1d] hover:text-zinc-400'
            }`
          }>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M8 8V3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <path d="M8 8l3.2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            {t('nav.insights')}
          </NavLink>
        </div>

        {/* User */}
        <div className="mt-auto p-3 border-t border-white/[0.04]">
          <NavLink to="/profile" onClick={onClose} className={({ isActive }) =>
            `flex items-center gap-2.5 p-2 rounded-md cursor-pointer transition-all ${
              isActive ? 'bg-[#141416]' : 'hover:bg-[#1a1a1d]'
            }`
          }>
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" className="w-[30px] h-[30px] rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-blue-700 to-violet-700 flex items-center justify-center text-[11px] font-bold shrink-0">
                {initials(profile?.displayName ?? name)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs text-white truncate">{profile?.displayName || name || 'Trader'}</div>
              <div className="text-[10px] text-zinc-600 truncate">{profile?.email ?? ''}</div>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
          </NavLink>
        </div>

      </aside>
    </>
  )
}