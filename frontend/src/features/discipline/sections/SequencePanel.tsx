import { Card, CardHeader, Skeleton } from '../../../design-system'
import { useSequence } from '../../../hooks/useAnalytics'
import { t, type TranslationKey } from '../../../i18n'
import { fmt, fmtPct, fmtR } from '../../../lib/format'

/**
 * Il primo, il secondo, il terzo trade della giornata.
 *
 * L'overtrading non si vede nel totale — lì è mescolato con tutto il resto — e
 * non si vede nemmeno nella media dei trade al giorno. Si vede qui, dove nella
 * maggior parte dei journal la curva crolla dopo il secondo: i primi due sono
 * i setup che aspettavi, dal terzo in poi di solito sono quelli che hai
 * trovato perché stavi ancora guardando lo schermo.
 */
// "1st", "2nd", "4th+" arrivano dal server già scritti, ed è uno dei pochi
// posti in cui il backend produce testo destinato all'occhio: in italiano
// diventano 1°, 2°, 4°+. La posizione è un numero, e il numero si sa scrivere
// in entrambe le lingue — l'etichetta del server resta solo come rete di
// sicurezza se un giorno i secchielli diventassero più di quattro.
const POSITION_KEYS: TranslationKey[] = [
  'discipline.pos1', 'discipline.pos2', 'discipline.pos3', 'discipline.posLast',
]

function positionLabel(position: number, fallback: string) {
  const key = POSITION_KEYS[position - 1]
  return key ? t(key) : fallback
}

export default function SequencePanel() {
  const { data, isLoading } = useSequence()

  const buckets = data?.buckets ?? []
  const maxAbsR = Math.max(0, ...buckets.map(b => Math.abs(b.metrics.netR)))

  // Il primo secchiello è il metro di paragone: "quanto peggio del tuo primo
  // trade" è più leggibile di un R assoluto che dipende da quanti trade fai.
  const first = buckets[0]
  const worst = buckets.slice(1).reduce<typeof first | undefined>(
    (w, b) => (w === undefined || b.metrics.expectancyR < w.metrics.expectancyR ? b : w),
    undefined,
  )
  const decays = first && worst && worst.metrics.totalTrades >= 5 &&
    worst.metrics.expectancyR < first.metrics.expectancyR - 0.2

  return (
    <Card interactive>
      <CardHeader
        title={t('discipline.sequenceTitle')}
        subtitle={
          data
            ? t('discipline.sequenceSubtitle', {
                avg: fmt(data.avgTradesPerDay, 1),
                max: data.maxTradesInADay,
                days: data.tradingDays,
              })
            : undefined
        }
      />

      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : buckets.length === 0 ? (
        <p className="text-xs text-content-muted py-6 text-center">{t('discipline.sequenceEmpty')}</p>
      ) : (
        <>
          {decays && (
            <p className="text-xs text-content-secondary leading-relaxed mb-3.5 pb-3.5 border-b border-line">
              {t('discipline.sequenceDecay', {
                position: positionLabel(worst.position, worst.label),
                value: fmtR(worst.metrics.expectancyR),
                first: fmtR(first.metrics.expectancyR),
                trades: worst.metrics.totalTrades,
              })}
            </p>
          )}

          <div className="flex flex-col gap-2.5">
            {buckets.map(b => {
              const width = maxAbsR > 0 ? (Math.abs(b.metrics.netR) / maxAbsR) * 100 : 0
              return (
                <div key={b.position} className="flex items-center gap-3">
                  <span className="text-2xs text-content-secondary font-mono w-[46px] shrink-0">
                    {positionLabel(b.position, b.label)}
                  </span>
                  <span className="text-2xs text-content-faint font-mono w-[54px] shrink-0">
                    {t('discipline.nTrades', { count: b.metrics.totalTrades })}
                  </span>
                  <span className="text-2xs text-content-faint font-mono w-[46px] shrink-0 text-right">
                    {fmtPct(b.metrics.winRate, 0)}
                  </span>
                  <div className="relative h-1.5 flex-1 min-w-[60px] rounded-full bg-surface-3" aria-hidden="true">
                    <div
                      className={`absolute top-0 h-full rounded-full ${b.metrics.netR >= 0 ? 'bg-pos left-1/2' : 'bg-neg right-1/2'}`}
                      style={{ width: `${width / 2}%` }}
                    />
                    <div className="absolute inset-y-0 left-1/2 w-px bg-line-2" />
                  </div>
                  <span className={`text-2xs font-mono w-[64px] shrink-0 text-right ${b.metrics.netR >= 0 ? 'text-pos' : 'text-neg'}`}>
                    {fmtR(b.metrics.netR)}
                  </span>
                </div>
              )
            })}
          </div>
        </>
      )}
    </Card>
  )
}
