import { Tooltip } from '../../design-system'
import { t } from '../../i18n'
import { fmtPnl, fmtUsdShort } from '../../lib/format'
import type { DailyPnLDto } from '../../types/stats'

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/**
 * Il mese, giorno per giorno.
 *
 * Il valore in cella era scritto sempre in migliaia: una giornata da +$89
 * usciva `+$0.1k`, cioè un arrotondamento che cancella il numero invece di
 * abbreviarlo. Ora sotto il migliaio si legge la cifra intera.
 *
 * Il valore esatto sta in un tooltip vero, non nell'attributo `title`.
 */
export default function MonthCalendar({ daily, refDate }: { daily: DailyPnLDto[]; refDate: Date }) {
  const year = refDate.getFullYear()
  const month = refDate.getMonth()

  const byDay = new Map<number, { pnl: number; trades: number }>()
  for (const d of daily) {
    const dt = new Date(d.date)
    if (dt.getFullYear() !== year || dt.getMonth() !== month) continue
    const cur = byDay.get(dt.getDate()) ?? { pnl: 0, trades: 0 }
    byDay.set(dt.getDate(), { pnl: cur.pnl + d.pnL, trades: cur.trades + d.totalTrades })
  }

  const maxAbs = Math.max(...[...byDay.values()].map(v => Math.abs(v.pnl)), 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leadOffset = (new Date(year, month, 1).getDay() + 6) % 7   // lunedì = 0

  // `grid-cols-7` stirava le celle a tutta larghezza: con `aspect-square`
  // diventavano quadrati da ~170px e il calendario occupava schermate intere.
  // Un tetto per colonna le lascia crescere fin dove serve e poi le ferma.
  const columns = { gridTemplateColumns: 'repeat(7, minmax(0, 76px))', justifyContent: 'start' as const }

  return (
    <div>
      <div className="grid gap-1 mb-1" style={columns}>
        {WEEK_DAYS.map(d => (
          <div key={d} className="text-center text-2xs text-content-faint uppercase tracking-widest pb-1">{d}</div>
        ))}
      </div>
      <div className="grid gap-1" style={columns}>
        {Array.from({ length: leadOffset }, (_, i) => <div key={`lead-${i}`} className="aspect-square" />)}

        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1
          const entry = byDay.get(day)
          const pnl = entry?.pnl ?? 0
          const traded = entry !== undefined && entry.trades > 0

          let tone = 'bg-surface-2 text-content-faint'
          if (traded && pnl !== 0) {
            const strong = Math.abs(pnl) > 0.6 * maxAbs
            tone = pnl > 0
              ? (strong ? 'bg-pos/25 text-pos border border-pos/30' : 'bg-pos/12 text-pos border border-pos/20')
              : (strong ? 'bg-neg/20 text-neg border border-neg/25' : 'bg-neg/10 text-neg border border-neg/15')
          } else if (traded) {
            tone = 'bg-surface-3 text-content-secondary border border-line'
          }

          // La cella è la stessa in entrambi i rami: senza tooltip deve restare
          // figlia diretta della griglia, o un contenitore in mezzo le
          // cambierebbe l'altezza rispetto alle vicine.
          const cell = (key?: number) => (
            <div
              key={key}
              className={`aspect-square rounded-md flex flex-col items-center justify-center gap-0.5 outline-none transition-[filter] ${tone} ${
                traded ? 'hover:brightness-125 focus-visible:ring-2 focus-visible:ring-brand/70' : ''
              }`}
              {...(traded ? { tabIndex: 0, role: 'img', 'aria-label': `${day}: ${fmtPnl(pnl)}` } : { 'aria-hidden': true })}
            >
              <span className="text-2xs leading-none">{day}</span>
              {traded && pnl !== 0 && (
                <span className="text-2xs font-medium leading-none font-mono">{pnl > 0 ? '+' : ''}{fmtUsdShort(pnl)}</span>
              )}
            </div>
          )

          if (!traded) return cell(day)

          return (
            <Tooltip
              key={day}
              content={
                <>
                  <span className="font-medium text-content-strong">
                    {new Date(year, month, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  {' · '}
                  <span className={`font-mono ${pnl >= 0 ? 'text-pos' : 'text-neg'}`}>{fmtPnl(pnl)}</span>
                  <span className="text-content-muted"> · {t('chart.tradesCount', { count: entry.trades })}</span>
                </>
              }
            >
              {cell()}
            </Tooltip>
          )
        })}
      </div>
    </div>
  )
}
