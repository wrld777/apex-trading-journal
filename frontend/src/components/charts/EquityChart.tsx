import { scaleLinear } from 'd3-scale'
import { area, curveMonotoneX, line } from 'd3-shape'

import {
  AxisX, AxisY, ChartEmpty, ChartFrame, ChartTooltip,
  Crosshair, GridY, ZeroLine, dateTicks, tickCountFor, useSeriesHover, xAt,
} from '../../design-system/charts'
import { t } from '../../i18n'
import { fmtDay, fmtPnl, fmtUsdShort } from '../../lib/format'
import { cumulative } from '../../lib/series'
import type { DailyPnLDto } from '../../types/stats'

/**
 * La curva del risultato cumulato.
 *
 * Un solo componente per la Dashboard e per Analytics: erano due copie dello
 * stesso grafico, divergenti nei dettagli (una stirata con
 * `preserveAspectRatio="none"`, l'altra no; una con le date sotto, l'altra
 * senza; entrambe con tre righe di griglia a quote fisse — `y=45, 90, 135` —
 * che non corrispondevano ad alcun valore).
 *
 * L'area si appoggia allo **zero**, non al bordo inferiore: sotto zero il
 * riempimento scende dalla linea dello zero invece di gonfiarsi verso il basso,
 * e il periodo in perdita si vede senza doverlo dedurre dal colore.
 */
export default function EquityChart({ daily, height = 180 }: { daily: DailyPnLDto[]; height?: number }) {
  const points = cumulative(daily)
  const n = points.length
  const hover = useSeriesHover(n)

  if (n === 0) return <ChartEmpty height={height}>{t('chart.noData')}</ChartEmpty>

  const values = points.map(p => p.value)
  const yScale = (h: number) => scaleLinear()
    .domain([Math.min(0, ...values), Math.max(0, ...values)]).nice()
    .range([h, 0])

  return (
    <ChartFrame
      height={height}
      label={t('chart.equityAria', { count: n, value: fmtPnl(values[n - 1]) })}
      svgProps={hover.svgProps}
      overlay={box => {
        if (hover.index === null) return null
        const p = points[hover.index]
        return (
          <ChartTooltip box={box} x={xAt(hover.index, n, box.inner.width)} y={yScale(box.inner.height)(p.value)}>
            <div className="font-medium text-content-strong">{fmtDay(p.date)}</div>
            <div>{t('chart.total')} <span className="font-mono">{fmtPnl(p.value)}</span></div>
            <div className="text-content-muted">
              {t('chart.thatDay')} <span className="font-mono">{fmtPnl(p.delta)}</span> · {t('chart.tradesCount', { count: p.trades })}
            </div>
          </ChartTooltip>
        )
      }}
    >
      {box => {
        const { width: w, height: h } = box.inner
        const x = (i: number) => xAt(i, n, w)
        const y = yScale(h)
        const ticks = y.ticks(tickCountFor(h))

        const positive = values[n - 1] >= 0
        const stroke = positive ? 'rgb(var(--c-pos))' : 'rgb(var(--c-neg))'

        const shape = line<number>().x((_, i) => x(i)).y(v => y(v)).curve(curveMonotoneX)
        const fill = area<number>().x((_, i) => x(i)).y0(y(0)).y1(v => y(v)).curve(curveMonotoneX)

        return (
          <>
            <GridY scale={y} width={w} ticks={ticks.filter(v => v !== 0)} />
            <AxisY scale={y} ticks={ticks} format={fmtUsdShort} />
            <ZeroLine y={y(0)} width={w} />
            <AxisX ticks={dateTicks(points.map(p => p.date), x)} y={h} width={w} />

            {/* Con un giorno solo non c'è una curva: si disegna il livello raggiunto. */}
            {n === 1 ? (
              <line x1={0} x2={w} y1={y(values[0])} y2={y(values[0])} stroke={stroke} strokeWidth={2} />
            ) : (
              <>
                <path d={fill(values) ?? ''} fill={stroke} fillOpacity={0.14} />
                <path d={shape(values) ?? ''} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </>
            )}

            <circle cx={x(n - 1)} cy={y(values[n - 1])} r={3.5} fill={stroke} />

            {hover.index !== null && (
              <>
                <Crosshair x={x(hover.index)} height={h} />
                <circle cx={x(hover.index)} cy={y(values[hover.index])} r={4}
                  fill="rgb(var(--c-surface))" stroke={stroke} strokeWidth={2} />
              </>
            )}

            <rect x={0} y={0} width={w} height={h} fill="transparent" {...hover.areaProps} />
          </>
        )
      }}
    </ChartFrame>
  )
}
