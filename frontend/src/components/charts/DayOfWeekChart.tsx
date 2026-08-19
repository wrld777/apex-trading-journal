import { scaleBand, scaleLinear } from 'd3-scale'

import {
  AxisY, ChartFrame, ChartTooltip, GridY, ZeroLine, useSeriesHover,
} from '../../design-system/charts'
import { t } from '../../i18n'
import { fmt, fmtPnl, fmtUsdShort } from '../../lib/format'
import type { DayOfWeekStatsDto } from '../../types/stats'

const DOW_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const
const DOW_SHORT: Record<string, string> = {
  Monday: t('analytics.dowMon'), Tuesday: t('analytics.dowTue'), Wednesday: t('analytics.dowWed'),
  Thursday: t('analytics.dowThu'), Friday: t('analytics.dowFri'),
}

/**
 * Risultato per giorno della settimana.
 *
 * Lo zero è al centro e le barre crescono nella direzione del segno: prima
 * partivano tutte dalla stessa base verso l'alto e un lunedì in perdita si
 * distingueva da un lunedì buono solo dal colore — a colpo d'occhio sembravano
 * la stessa cosa.
 *
 * La scala è simmetrica attorno allo zero apposta: con estremi indipendenti,
 * una perdita da 200$ e un guadagno da 200$ risulterebbero barre di lunghezza
 * diversa, e il confronto fra i due lati salterebbe.
 */
export default function DayOfWeekChart({ dow, height = 150 }: { dow: DayOfWeekStatsDto[]; height?: number }) {
  const byDay = new Map(dow.map(d => [d.day, d]))
  const bars = DOW_ORDER.map(day => ({
    day,
    label: DOW_SHORT[day],
    pnl: byDay.get(day)?.pnL ?? 0,
    r: byDay.get(day)?.r ?? 0,
    trades: byDay.get(day)?.totalTrades ?? 0,
  }))

  const maxAbs = Math.max(...bars.map(b => Math.abs(b.pnl)), 1)
  const hover = useSeriesHover(bars.length, 'band')

  const yScale = (h: number) => scaleLinear().domain([-maxAbs, maxAbs]).nice().range([h, 0])
  const xScale = (w: number) => scaleBand<string>().domain(bars.map(b => b.day)).range([0, w]).padding(0.34)

  return (
    <ChartFrame
      height={height}
      margin={{ left: 40, right: 4, top: 8, bottom: 20 }}
      label={t('chart.dowAria')}
      svgProps={hover.svgProps}
      overlay={box => {
        if (hover.index === null) return null
        const b = bars[hover.index]
        const x = xScale(box.inner.width)
        const y = yScale(box.inner.height)
        return (
          <ChartTooltip
            box={box}
            x={(x(b.day) ?? 0) + x.bandwidth() / 2}
            y={Math.min(y(b.pnl), y(0))}
          >
            <div className="font-medium text-content-strong">{b.label}</div>
            <div>
              <span className={b.pnl >= 0 ? 'text-pos font-mono' : 'text-neg font-mono'}>{fmtPnl(b.pnl)}</span>
              <span className="text-content-muted"> · {fmt(b.r, 2)}R</span>
            </div>
            <div className="text-content-muted">{t('chart.tradesCount', { count: b.trades })}</div>
          </ChartTooltip>
        )
      }}
    >
      {box => {
        const { width: w, height: h } = box.inner
        const x = xScale(w)
        const y = yScale(h)
        const ticks = y.ticks(3)

        return (
          <>
            <GridY scale={y} width={w} ticks={ticks.filter(v => v !== 0)} />
            <AxisY scale={y} ticks={ticks} format={fmtUsdShort} />
            <ZeroLine y={y(0)} width={w} />

            {bars.map((b, i) => {
              const bx = x(b.day) ?? 0
              const top = b.pnl >= 0 ? y(b.pnl) : y(0)
              // Una barra alta zero pixel sparisce: due pixel dicono "giorno
              // registrato, risultato nullo", che è diverso da "mai operato".
              const bh = Math.max(Math.abs(y(b.pnl) - y(0)), b.trades > 0 ? 2 : 0)
              const on = hover.index === i
              return (
                <rect
                  key={b.day}
                  x={bx} y={top} width={x.bandwidth()} height={bh} rx={2}
                  fill={b.pnl >= 0 ? 'rgb(var(--c-pos))' : 'rgb(var(--c-neg))'}
                  fillOpacity={on ? 0.95 : 0.6}
                />
              )
            })}

            {bars.map(b => (
              <text
                key={b.day}
                x={(x(b.day) ?? 0) + x.bandwidth() / 2}
                y={h + 14}
                textAnchor="middle"
                className="text-2xs"
                fill="rgb(var(--c-text-faint))"
              >
                {b.label}
              </text>
            ))}

            <rect x={0} y={0} width={w} height={h} fill="transparent" {...hover.areaProps} />
          </>
        )
      }}
    </ChartFrame>
  )
}
