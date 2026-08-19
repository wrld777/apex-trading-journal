import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useProfile } from '../../hooks/useProfile'
import { t } from '../../i18n'

import { NAV, type NavItem } from './nav'
import { Tooltip, Wordmark, cn } from '../../design-system'

interface SidebarProps {
  /** Cassetto aperto su mobile. Su desktop la sidebar c'è sempre. */
  open: boolean
  onClose: () => void
  /** Ridotta a sole icone. Ignorata su mobile, dove lo spazio non manca. */
  collapsed: boolean
}

function initials(name: string | null): string {
  if (!name) return '—'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '—'
}

function NavRow({ item, collapsed, onNavigate }: { item: NavItem; collapsed: boolean; onNavigate: () => void }) {
  const label = t(item.labelKey)
  const link = (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 h-9 rounded text-sm transition-colors border',
          collapsed ? 'justify-center px-0 w-9' : 'px-2.5',
          isActive
            ? 'bg-surface-2 text-content-strong border-line-2'
            : 'text-content-muted border-transparent hover:bg-surface-3 hover:text-content',
        )
      }
    >
      <item.Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      {/* Da ridotta l'etichetta sparisce dalla vista ma resta leggibile agli
          screen reader: un menù di sole icone senza nome non è navigabile. */}
      <span className={collapsed ? 'sr-only' : 'truncate'}>{label}</span>
    </NavLink>
  )

  return collapsed ? <Tooltip content={label} side="right">{link}</Tooltip> : link
}

export default function Sidebar({ open, onClose, collapsed }: SidebarProps) {
  const name = useAuthStore((s) => s.name)
  const { data: profile } = useProfile()
  const displayName = profile?.displayName || name || t('dash.trader')

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-drawer lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        aria-label={t('nav.primary')}
        className={cn(
          'fixed top-0 left-0 bottom-0 bg-bg border-r border-line flex flex-col z-drawer',
          'transition-[transform,width] duration-300 ease-out',
          collapsed ? 'lg:w-[60px]' : 'lg:w-[220px]',
          'w-[220px]',
          open ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0',
        )}
      >
        {/* Marchio */}
        <div className={cn('h-[52px] border-b border-line flex items-center shrink-0', collapsed ? 'lg:justify-center lg:px-0 px-4' : 'px-4')}>
          <Wordmark size={22} hideName={collapsed} />
        </div>

        <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-4">
          {NAV.map((group) => (
            <div key={group.labelKey} className="flex flex-col gap-0.5">
              {/* Da ridotta l'intestazione di gruppo diventa un filetto: il
                  raggruppamento si vede ancora, senza testo tagliato. */}
              {collapsed ? (
                <div className="h-px bg-line mx-2 mb-2 lg:block hidden" />
              ) : (
                <p className="text-2xs text-content-faint uppercase tracking-widest px-2 pb-1.5">
                  {t(group.labelKey)}
                </p>
              )}
              {group.items.map((item) => (
                <NavRow key={item.to} item={item} collapsed={collapsed} onNavigate={onClose} />
              ))}
            </div>
          ))}
        </nav>

        {/* Profilo */}
        <div className="mt-auto p-3 border-t border-line shrink-0">
          <NavLink
            to="/profile"
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 p-2 rounded transition-colors',
                collapsed && 'lg:justify-center lg:p-1.5',
                isActive ? 'bg-surface-2' : 'hover:bg-surface-3',
              )
            }
          >
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-brand text-brand-ink flex items-center justify-center text-2xs font-semibold shrink-0">
                {initials(displayName)}
              </div>
            )}
            <div className={cn('flex-1 min-w-0', collapsed && 'lg:hidden')}>
              <div className="text-xs text-content truncate">{displayName}</div>
              <div className="text-2xs text-content-muted truncate">{profile?.email ?? ''}</div>
            </div>
          </NavLink>
        </div>
      </aside>
    </>
  )
}
