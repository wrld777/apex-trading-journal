import { useLocation, useNavigate } from 'react-router-dom'
import { t, type TranslationKey } from '../i18n'

// Nessuna etichetta di periodo quassù: il periodo lo scelgono le pagine — il
// selettore della Dashboard, il range da/a di Analytics — e una scritta fissa
// qui finisce solo per contraddirle. "May 2025" è rimasta appesa per un anno.
const PAGE_META: Record<string, [TranslationKey, TranslationKey | '']> = {
  '/':                   ['nav.dashboard', ''],
  '/log-trade':          ['nav.logTrade', 'nav.newEntry'],
  '/analytics':          ['nav.analytics', ''],
  '/trades':             ['nav.tradeLog', ''],
  '/strategies':         ['nav.strategies', ''],
  '/strategy-insights':  ['insights.title', ''],
  '/profile':            ['nav.profile', ''],
}

interface TopbarProps {
  onMenuClick: () => void
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [titleKey, metaKey] = PAGE_META[pathname] ?? ['brand.name', '']
  const title = t(titleKey)
  const meta = metaKey ? t(metaKey) : ''

  return (
    <header className="h-[52px] bg-bg border-b border-line flex items-center px-4 lg:px-6 gap-3 sticky top-0 z-sticky">

      {/* Hamburger — visible only on mobile */}
      <button
        onClick={onMenuClick}
        aria-label={t('nav.openNavigation')}
        className="lg:hidden bg-surface-2 border border-line-2 rounded-md p-1.5 text-content-secondary hover:text-content-strong transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <line x1="1" y1="3"  x2="13" y2="3"  stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          <line x1="1" y1="7"  x2="13" y2="7"  stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          <line x1="1" y1="11" x2="9"  y2="11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      </button>

      <span className="font-sans font-semibold text-sm text-content-strong tracking-tight">{title}</span>
      {meta && (
        <span className="text-[11px] text-content-muted before:content-['/'] before:mr-1.5 before:text-content-faint">
          {meta}
        </span>
      )}

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-content-secondary border border-line-2 hover:bg-surface-3 hover:text-content-strong transition-all">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.2"/>
            <line x1="8" y1="8" x2="11" y2="11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          {t('nav.search')}
        </button>
        <button
          onClick={() => navigate('/log-trade')}
          className="px-3 py-1.5 rounded-md text-xs font-medium bg-white text-black hover:bg-white/90 transition-all"
        >
          + {t('nav.logTrade')}
        </button>
      </div>
    </header>
  )
}