import { arc, pie } from 'd3-shape'

import { Tooltip } from '../../design-system'
import { t } from '../../i18n'
import { fmt } from '../../lib/format'

const SIZE = 120
const RADIUS = SIZE / 2
const THICKNESS = 18

/**
 * Composizione degli esiti.
 *
 * Le fette erano tre `<circle>` sovrapposti con `strokeDasharray` calcolato a
 * mano e `strokeLinecap="round"`: le estremità arrotondate di una fetta
 * coprivano l'inizio della successiva, quindi a occhio le proporzioni erano
 * sbagliate — con un 90% di vincite la fetta rossa spariva del tutto.
 * Qui sono archi veri, e la geometria la calcola `d3-shape`.
 *
 * Il pareggio compare come terza fetta quando esiste: senza, la somma delle
 * fette non fa il totale dei trade e il cerchio racconta un campione che non è
 * quello.
 */
export default function WinLossDonut({
  winCount, lossCount, breakEvenCount = 0, winRate,
}: { winCount: number; lossCount: number; breakEvenCount?: number; winRate: number }) {
  const slices = [
    { key: 'win',  value: winCount,       color: 'rgb(var(--c-pos))',      legend: 'bg-pos',      label: t('analytics.wins',   { count: winCount }) },
    { key: 'loss', value: lossCount,      color: 'rgb(var(--c-neg))',      legend: 'bg-neg',      label: t('analytics.losses', { count: lossCount }) },
    { key: 'be',   value: breakEvenCount, color: 'rgb(var(--c-neutral))',  legend: 'bg-neutral2', label: t('chart.breakEven',  { count: breakEvenCount }) },
  ].filter(s => s.value > 0)

  const total = slices.reduce((sum, s) => sum + s.value, 0)

  const layout = pie<typeof slices[number]>()
    .value(s => s.value)
    .sort(null)          // l'ordine è quello dichiarato: vinti, persi, pari
    .startAngle(0)
    .endAngle(2 * Math.PI)
  const shape = arc<ReturnType<typeof layout>[number]>()
    .innerRadius(RADIUS - THICKNESS)
    .outerRadius(RADIUS)
    .padAngle(total > 0 && slices.length > 1 ? 0.02 : 0)
    .cornerRadius(2)

  return (
    <>
      <div className="flex items-center justify-center py-2">
        <svg width={SIZE} height={SIZE} role="img"
          aria-label={t('chart.donutAria', { rate: fmt(winRate, 1), wins: winCount, losses: lossCount })}>
          <g transform={`translate(${RADIUS},${RADIUS})`}>
            {total === 0 ? (
              <circle r={RADIUS - THICKNESS / 2} fill="none" stroke="rgb(var(--c-surface-2))" strokeWidth={THICKNESS} />
            ) : (
              layout(slices).map(d => (
                <Tooltip
                  key={d.data.key}
                  content={
                    <>
                      <span className="font-medium text-content-strong">{d.data.label}</span>
                      {' · '}
                      <span className="font-mono">{fmt((d.data.value / total) * 100, 1)}%</span>
                    </>
                  }
                >
                  <path
                    d={shape(d) ?? ''}
                    fill={d.data.color}
                    tabIndex={0}
                    className="outline-none focus-visible:brightness-125 hover:brightness-110 transition-[filter]"
                  />
                </Tooltip>
              ))
            )}
            <text textAnchor="middle" y={-1} className="text-md" fontWeight={600}
              fontFamily="var(--font-mono)" fill="rgb(var(--c-text-strong))">
              {fmt(winRate, 1)}%
            </text>
            <text textAnchor="middle" y={13} className="text-2xs"
              fill="rgb(var(--c-text-faint))">
              {t('analytics.winRateRing')}
            </text>
          </g>
        </svg>
      </div>
      <div className="flex justify-center flex-wrap gap-x-4 gap-y-1">
        {slices.map(s => (
          <div key={s.key} className="flex items-center gap-1.5 text-xs text-content-muted">
            <span className={`w-1.5 h-1.5 rounded-full ${s.legend}`} />{s.label}
          </div>
        ))}
      </div>
    </>
  )
}
