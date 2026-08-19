import { scaleLinear } from 'd3-scale'
import { area, curveMonotoneX, line } from 'd3-shape'

import {
  AxisX, AxisY, ChartEmpty, ChartFrame, ChartTooltip,
  Crosshair, GridY, dateTicks, tickCountFor, useSeriesHover, xAt,
} from '../../design-system/charts'
import { t } from '../../i18n'
import { fmt, fmtDay } from '../../lib/format'
import { cumulative, drawdownSeries } from '../../lib/series'
import type { DailyPnLDto } from '../../types/stats'

/**
 * Quanto si è restituito del massimo raggiunto, giorno per giorno.
 *
 * Si misura in **R** e non in dollari: il drawdown in dollari si legge solo
 * contro un capitale, e il capitale è proprio ciò che la #106 ha tolto
 * dall'app. In R la domanda diventa "quante unità di rischio ho restituito",
 * che è una proprietà della strategia e non del conto.
 *
 * Zero sta in alto e la curva scende: è la convenzione del grafico *underwater*
 * — la superficie è il picco, e più si è sotto peggio va.
 */
export default function DrawdownChart({ daily, height = 180 }: { daily: DailyPnLDto[]; height?: number }) {
  const points = cumulative(daily, d => d.r)
  const n = points.length
  const dd = drawdownSeries(points.map(p => p.value))
  const hover = useSeriesHover(n)

  if (n === 0) return <ChartEmpty height={height}>{t('chart.noData')}</ChartEmpty>

  const maxDD = Math.max(...dd, 0)
  // Con un solo R di escursione la scala resta leggibile; senza questo minimo,
  // un drawdown di 0,02R riempirebbe il riquadro e sembrerebbe un disastro.
  const yScale = (h: number) => scaleLinear().domain([0, Math.max(maxDD, 1)]).nice().range([0, h])

  return (
    <ChartFrame
      height={height}
      label={t('chart.drawdownAria', { value: fmt(maxDD, 2) })}
      svgProps={hover.svgProps}
      overlay={box => {
        if (hover.index === null) return null
        return (
          <ChartTooltip box={box} x={xAt(hover.index, n, box.inner.width)} y={yScale(box.inner.height)(dd[hover.index])}>
            <div className="font-medium text-content-strong">{fmtDay(points[hover.index].date)}</div>
            <div>{t('chart.underPeak')} <span className="font-mono text-neg">−{fmt(dd[hover.index], 2)}R</span></div>
          </ChartTooltip>
        )
      }}
    >
      {box => {
        const { width: w, height: h } = box.inner
        const x = (i: number) => xAt(i, n, w)
        const y = yScale(h)
        const ticks = y.ticks(tickCountFor(h))

        const shape = line<number>().x((_, i) => x(i)).y(v => y(v)).curve(curveMonotoneX)
        const fill = area<number>().x((_, i) => x(i)).y0(0).y1(v => y(v)).curve(curveMonotoneX)

        const worst = dd.indexOf(maxDD)

        return (
          <>
            <GridY scale={y} width={w} ticks={ticks.filter(v => v !== 0)} />
            <AxisY scale={y} ticks={ticks} format={v => (v === 0 ? '0' : `−${fmt(v, v < 1 ? 1 : 0)}R`)} />
            <line x1={0} x2={w} y1={0} y2={0} stroke="rgb(var(--c-border-2))" strokeWidth={1} />
            <AxisX ticks={dateTicks(points.map(p => p.date), x)} y={h} width={w} />

            {n === 1 ? (
              <line x1={0} x2={w} y1={y(dd[0])} y2={y(dd[0])} stroke="rgb(var(--c-neg))" strokeWidth={2} />
            ) : (
              <>
                <path d={fill(dd) ?? ''} fill="rgb(var(--c-neg))" fillOpacity={0.14} />
                <path d={shape(dd) ?? ''} fill="none" stroke="rgb(var(--c-neg))" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
              </>
            )}

            {/* Il punto peggiore resta segnato anche senza puntatore: è il numero
                che si va a cercare aprendo questo grafico. */}
            {maxDD > 0 && (
              <>
                <circle cx={x(worst)} cy={y(maxDD)} r={3} fill="rgb(var(--c-neg))" />
                <text
                  x={x(worst)} y={y(maxDD) + 15}
                  textAnchor={x(worst) > w - 40 ? 'end' : x(worst) < 40 ? 'start' : 'middle'}
                  className="text-2xs" fontFamily="var(--font-mono)" fill="rgb(var(--c-neg))"
                >
                  −{fmt(maxDD, 2)}R
                </text>
              </>
            )}

            {hover.index !== null && (
              <>
                <Crosshair x={x(hover.index)} height={h} />
                <circle cx={x(hover.index)} cy={y(dd[hover.index])} r={4}
                  fill="rgb(var(--c-surface))" stroke="rgb(var(--c-neg))" strokeWidth={2} />
              </>
            )}

            <rect x={0} y={0} width={w} height={h} fill="transparent" {...hover.areaProps} />
          </>
        )
      }}
    </ChartFrame>
  )
}
