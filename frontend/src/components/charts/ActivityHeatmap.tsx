import { Fragment } from 'react'

import { Tooltip } from '../../design-system'
import { t } from '../../i18n'
import { fmtPnl } from '../../lib/format'
import type { DailyPnLDto } from '../../types/stats'

const WEEKS = 13
/** Solo i giorni feriali: il fine settimana i mercati sono chiusi. */
const DAY_INITIALS = ['M', 'T', 'W', 'T', 'F']

/** Cinque gradini di intensità per parte: oltre, le sfumature non si distinguono. */
const TONE: Record<string, string> = {
  '0':  'bg-surface-2',
  '1':  'bg-pos/15',  '2':  'bg-pos/30',  '3':  'bg-pos/50',  '4':  'bg-pos/75',
  '-1': 'bg-neg/15',  '-2': 'bg-neg/30',  '-3': 'bg-neg/50',
}

/**
 * Le ultime tredici settimane, un quadratino per giorno feriale.
 *
 * Il valore stava nell'attributo `title`: compariva dopo un secondo abbondante,
 * non si apriva col Tab e non si poteva intonare. Ora è un tooltip vero, e i
 * giorni con dati sono raggiungibili da tastiera — quelli vuoti no, altrimenti
 * si attraverserebbero sessantacinque caselle silenziose per trovarne quattro
 * che dicono qualcosa.
 */
export default function ActivityHeatmap({ daily }: { daily: DailyPnLDto[] }) {
  const byDate = new Map<string, DailyPnLDto>()
  for (const d of daily) byDate.set(d.date.slice(0, 10), d)

  const maxAbs = daily.reduce((m, d) => Math.max(m, Math.abs(d.pnL)), 0)

  // Lunedì di questa settimana, poi indietro di dodici: finestra di 13 settimane.
  const today = new Date()
  const startMonday = new Date(today)
  startMonday.setDate(today.getDate() - ((today.getDay() + 6) % 7) - (WEEKS - 1) * 7)

  const dateAt = (week: number, day: number) => {
    const d = new Date(startMonday)
    d.setDate(startMonday.getDate() + week * 7 + day)
    return d
  }
  const keyOf = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  const tone = (pnl: number | undefined) => {
    if (pnl === undefined || pnl === 0 || maxAbs === 0) return TONE['0']
    const ratio = Math.abs(pnl) / maxAbs
    return pnl > 0
      ? TONE[String(Math.min(Math.ceil(ratio * 4), 4))]
      : TONE[String(-Math.min(Math.ceil(ratio * 3), 3))]
  }

  // Il nome del mese compare sulla settimana in cui il mese cambia: senza,
  // tredici colonne uguali non dicono di che periodo si sta parlando.
  const monthLabels = Array.from({ length: WEEKS }, (_, w) => {
    const m = dateAt(w, 0).getMonth()
    const prev = w === 0 ? -1 : dateAt(w - 1, 0).getMonth()
    return m === prev ? '' : dateAt(w, 0).toLocaleDateString('en-US', { month: 'short' })
  })

  // Le colonne erano `1fr`: su desktop diventavano quadrati da ~90px e la
  // heatmap si mangiava mezza pagina. Il tetto risolveva quello, ma a 26px era
  // troppo stretto e su un monitor largo la heatmap sembrava persa in un angolo
  // della card.
  //
  // Il tetto non è un numero a piacere: le celle sono **quadrate**, quindi ogni
  // pixel di larghezza è anche un pixel di altezza per cinque righe. A 48px
  // occupa ~700×256, che riempie la card senza spingere il resto fuori
  // schermo; sopra i 60 tornerebbe a mangiarsi la pagina.
  const columns = {
    display: 'grid',
    gridTemplateColumns: `28px repeat(${WEEKS}, minmax(0, 48px))`,
    gap: 4,
    justifyContent: 'start' as const,
  }

  return (
    <div style={columns}>
      <div />
      {monthLabels.map((label, w) => (
        <div key={`m-${w}`} className="text-2xs text-content-faint leading-none pb-1">{label}</div>
      ))}

      {DAY_INITIALS.map((initial, di) => (
        <Fragment key={`row-${di}`}>
          <div className="text-2xs text-content-faint flex items-center justify-end pr-1">{initial}</div>
          {Array.from({ length: WEEKS }, (_, w) => {
            const date = dateAt(w, di)
            const entry = byDate.get(keyOf(date))
            const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            const future = date > today

            if (!entry) {
              return (
                <div
                  key={`${di}-${w}`}
                  className={`aspect-square rounded-sm ${future ? 'bg-surface-2/40' : TONE['0']}`}
                  aria-hidden="true"
                />
              )
            }

            return (
              <Tooltip
                key={`${di}-${w}`}
                content={
                  <>
                    <span className="font-medium text-content-strong">{label}</span>
                    {' · '}
                    <span className={`font-mono ${entry.pnL >= 0 ? 'text-pos' : 'text-neg'}`}>{fmtPnl(entry.pnL)}</span>
                    <span className="text-content-muted"> · {t('chart.tradesCount', { count: entry.totalTrades })}</span>
                  </>
                }
              >
                <div
                  tabIndex={0}
                  role="img"
                  aria-label={`${label}: ${fmtPnl(entry.pnL)}, ${t('chart.tradesCount', { count: entry.totalTrades })}`}
                  className={`aspect-square rounded-sm outline-none hover:brightness-125 focus-visible:ring-2 focus-visible:ring-brand/70 transition-[filter] ${tone(entry.pnL)}`}
                />
              </Tooltip>
            )
          })}
        </Fragment>
      ))}
    </div>
  )
}
