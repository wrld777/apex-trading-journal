import { scaleLinear } from 'd3-scale'
import { area, curveMonotoneX, line } from 'd3-shape'

import {
  AxisX, AxisY, ChartEmpty, ChartFrame, ChartTooltip,
  Crosshair, GridY, dateTicks, useSeriesHover, xAt,
} from '../../design-system/charts'
import { t } from '../../i18n'
import { fmt, fmtDay } from '../../lib/format'
import type { DisciplinePointDto } from '../../types/analytics'

/**
 * Aderenza alla checklist nel tempo.
 *
 * La scala resta fissa a 0–100 anche quando i valori stanno tutti fra il 70 e
 * l'80: adattarla agli estremi farebbe sembrare una montagna russa una serie
 * praticamente piatta. Su una percentuale il riferimento è il 100, non il
 * massimo osservato.
 *
 * Il colore è quello di marca, non il verde: qui non c'è un guadagno da
 * dichiarare — rispettare le regole non è di per sé un risultato positivo, ed è
 * proprio il confronto fra le due cose il senso di questa pagina.
 */
export default function DisciplineChart({ points, height = 180 }: { points: DisciplinePointDto[]; height?: number }) {
  const n = points.length
  const hover = useSeriesHover(n)

  if (n === 0) return <ChartEmpty height={height}>{t('insights.noAdherenceData')}</ChartEmpty>

  const values = points.map(p => p.adherenceRate)
  const yScale = (h: number) => scaleLinear().domain([0, 100]).range([h, 0])

  return (
    <ChartFrame
      height={height}
      label={t('chart.disciplineAria', { value: fmt(values[n - 1], 0) })}
      svgProps={hover.svgProps}
      overlay={box => {
        if (hover.index === null) return null
        const p = points[hover.index]
        return (
          <ChartTooltip box={box} x={xAt(hover.index, n, box.inner.width)} y={yScale(box.inner.height)(p.adherenceRate)}>
            <div className="font-medium text-content-strong">{fmtDay(p.periodStart)}</div>
            <div>{t('chart.adherence')} <span className="font-mono text-brand">{fmt(p.adherenceRate, 0)}%</span></div>
            <div className="text-content-muted">{t('chart.tradesCount', { count: p.totalTrades })}</div>
          </ChartTooltip>
        )
      }}
    >
      {box => {
        const { width: w, height: h } = box.inner
        const x = (i: number) => xAt(i, n, w)
        const y = yScale(h)

        const shape = line<number>().x((_, i) => x(i)).y(v => y(v)).curve(curveMonotoneX)
        const fill = area<number>().x((_, i) => x(i)).y0(h).y1(v => y(v)).curve(curveMonotoneX)

        return (
          <>
            <GridY scale={y} width={w} ticks={[25, 50, 75]} />
            <AxisY scale={y} ticks={[0, 50, 100]} format={v => `${v}%`} />
            <line x1={0} x2={w} y1={y(100)} y2={y(100)} stroke="rgb(var(--c-border-2))" strokeDasharray="3 3" strokeWidth={1} />
            <AxisX ticks={dateTicks(points.map(p => p.periodStart), x, 3)} y={h} width={w} />

            {n === 1 ? (
              <line x1={0} x2={w} y1={y(values[0])} y2={y(values[0])} stroke="rgb(var(--c-brand))" strokeWidth={2} />
            ) : (
              <>
                <path d={fill(values) ?? ''} fill="rgb(var(--c-brand))" fillOpacity={0.14} />
                <path d={shape(values) ?? ''} fill="none" stroke="rgb(var(--c-brand))" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </>
            )}

            {/* I punti si mostrano perché le settimane sono poche e contate: qui
                ogni pallino è un periodo, non un campione di una curva continua. */}
            {n <= 40 && points.map((p, i) => (
              <circle key={p.periodStart} cx={x(i)} cy={y(p.adherenceRate)} r={2.5} fill="rgb(var(--c-brand))" />
            ))}

            {hover.index !== null && (
              <>
                <Crosshair x={x(hover.index)} height={h} />
                <circle cx={x(hover.index)} cy={y(values[hover.index])} r={4}
                  fill="rgb(var(--c-surface))" stroke="rgb(var(--c-brand))" strokeWidth={2} />
              </>
            )}

            <rect x={0} y={0} width={w} height={h} fill="transparent" {...hover.areaProps} />
          </>
        )
      }}
    </ChartFrame>
  )
}
