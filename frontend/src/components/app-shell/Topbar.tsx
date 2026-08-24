import { useNavigate } from 'react-router-dom'
import { Menu, PanelLeftClose, PanelLeftOpen, Plus } from 'lucide-react'
import { t } from '../../i18n'
import { Button, IconButton } from '../../design-system'

/**
 * La barra in alto.
 *
 * Prima ripeteva il titolo della pagina da una tabella `PAGE_META`, che era
 * una seconda fonte per gli stessi nomi già scritti nella sidebar e nel
 * `PageHeader` della pagina — tre posti da tenere allineati a mano. Ora il
 * titolo lo dice la pagina, una volta sola.
 *
 * È sparito anche il bottone "Search": non aveva `onClick`, cioè prometteva
 * una funzione che non esisteva — lo stesso difetto dei tasti periodo della
 * #108. Tornerà come palette comandi quando ci sarà abbastanza da cercare;
 * sette pagine non la giustificano.
 */

interface TopbarProps {
  onMenuClick: () => void
  collapsed: boolean
  onToggleCollapse: () => void
}

export default function Topbar({ onMenuClick, collapsed, onToggleCollapse }: TopbarProps) {
  const navigate = useNavigate()

  return (
    <header className="h-[52px] bg-bg border-b border-line flex items-center px-3 lg:px-5 gap-2 sticky top-0 z-sticky">
      <IconButton onClick={onMenuClick} label={t('nav.openNavigation')} className="lg:hidden">
        <Menu className="h-4 w-4" aria-hidden="true" />
      </IconButton>

      <IconButton
        onClick={onToggleCollapse}
        label={collapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
        aria-pressed={collapsed}
        className="hidden lg:inline-flex"
      >
        {collapsed
          ? <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
          : <PanelLeftClose className="h-4 w-4" aria-hidden="true" />}
      </IconButton>

      <div className="flex-1" />

      <Button variant="primary" onClick={() => navigate('/log-trade')}>
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        {t('nav.logTrade')}
      </Button>
    </header>
  )
}
