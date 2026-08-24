import { scaleLinear } from 'd3-scale'
import { area, curveMonotoneX, line } from 'd3-shape'

import ChartFrame from './ChartFrame'

/**
 * Andamento in miniatura, senza assi né tacche.
 *
 * Le tre miniature sulle card KPI della Dashboard erano **finite**: sei coppie
 * di coordinate scritte a mano nel JSX, identiche a ogni caricamento e per ogni
 * utente. Un grafico inventato accanto a un numero vero non è decorazione, è
 * una bugia — chi guarda legge una tendenza che nessuno ha misurato.
 *
 * Questa versione disegna solo ciò che le viene passato: dove la serie non
 * esiste, la miniatura non si mostra.
 */
export default function Sparkline({
  values, height = 28, tone = 'pos', label,
}: {
  values: number[]
  height?: number
  tone?: 'pos' | 'neg' | 'brand'
  label: string
}) {
  if (values.length < 2) return null

  const stroke = `rgb(var(--c-${tone}))`

  return (
    <ChartFrame
      height={height}
      margin={{ top: 3, right: 1, bottom: 3, left: 1 }}
      label={label}
    >
      {box => {
        const x = scaleLinear().domain([0, values.length - 1]).range([0, box.inner.width])
        const y = scaleLinear()
          .domain([Math.min(...values), Math.max(...values)])
          .range([box.inner.height, 0])
          .nice()

        const shape = line<number>().x((_, i) => x(i)).y(v => y(v)).curve(curveMonotoneX)
        const fill = area<number>()
          .x((_, i) => x(i)).y0(box.inner.height).y1(v => y(v)).curve(curveMonotoneX)

        return (
          <>
            <path d={fill(values) ?? ''} fill={stroke} fillOpacity={0.12} />
            <path d={shape(values) ?? ''} fill="none" stroke={stroke} strokeOpacity={0.7} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          </>
        )
      }}
    </ChartFrame>
  )
}
