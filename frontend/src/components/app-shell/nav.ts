import { ClipboardList, Gauge, LayoutGrid, ListChecks, PlusCircle, ShieldCheck, TrendingUp } from 'lucide-react'
import type { TranslationKey } from '../../i18n'

/**
 * La navigazione come dato, non come markup.
 *
 * Prima ogni voce era un `NavLink` scritto a mano con il suo SVG dentro: sei
 * blocchi di venti righe identiche tranne l'icona, e nessun posto dove leggere
 * la struttura del prodotto. Aggiungere una pagina significava copiare un
 * blocco e sperare di non dimenticare niente.
 *
 * I gruppi seguono le due domande dell'utente: "come sta andando" e "cosa ho
 * fatto".
 */

export interface NavItem {
  to: string
  /** `end` serve solo alla rotta radice, o resterebbe attiva ovunque. */
  end?: boolean
  labelKey: TranslationKey
  Icon: typeof LayoutGrid
}

export interface NavGroup {
  labelKey: TranslationKey
  items: NavItem[]
}

export const NAV: NavGroup[] = [
  {
    labelKey: 'nav.overview',
    items: [
      { to: '/', end: true, labelKey: 'nav.dashboard', Icon: LayoutGrid },
      { to: '/analytics', labelKey: 'nav.analytics', Icon: TrendingUp },
      { to: '/discipline', labelKey: 'nav.discipline', Icon: ShieldCheck },
    ],
  },
  {
    labelKey: 'nav.trades',
    items: [
      { to: '/log-trade', labelKey: 'nav.logTrade', Icon: PlusCircle },
      { to: '/trades', labelKey: 'nav.tradeLog', Icon: ClipboardList },
      { to: '/strategies', labelKey: 'nav.strategies', Icon: ListChecks },
      { to: '/strategy-insights', labelKey: 'nav.insights', Icon: Gauge },
    ],
  },
]
