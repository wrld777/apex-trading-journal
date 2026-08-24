import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react'

import { Badge, Card, CardHeader, Skeleton, Stat } from '../../../design-system'
import { useWeeklyReview } from '../../../hooks/useAnalytics'
import { t } from '../../../i18n'
import { fmt, fmtPct, fmtPnl, fmtR } from '../../../lib/format'

/**
 * La settimana appena passata, accanto a quella prima.
 *
 * Un journal muore senza un momento in cui si guarda: si registrano trade per
 * mesi e non si torna mai indietro. Questa è quella pagina, e sta in cima
 * perché è la domanda con cui si arriva — *com'è andata* — mentre tutto il
 * resto qui sotto risponde al perché.
 *
 * Il confronto è con la settimana prima e non con una media storica: sette
 * giorni fa te li ricordi, e una media su sei mesi non dice cosa fare lunedì.
 */

/** Una differenza fra due settimane, col verso. Sotto la soglia è "uguale":
 *  fingere che mezzo punto sia un miglioramento è il modo di non crederci più. */
function Delta({ value, format }: { value: number; format: (n: number) => string }) {
  const flat = Math.abs(value) < 0.005
  const Icon = flat ? ArrowRight : value > 0 ? ArrowUpRight : ArrowDownRight
  const tone = flat
    ? 'bg-surface-3 text-content-secondary'
    : value > 0 ? 'bg-pos/10 text-pos' : 'bg-neg/10 text-neg'

  return (
    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-2xs ${tone}`}>
      <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
      {flat ? t('discipline.flat') : format(value)}
    </span>
  )
}

export default function WeeklyReview() {
  const { data, isLoading } = useWeeklyReview()

  if (isLoading) return <Skeleton className="h-56 w-full rounded-lg" />
  if (!data) return null

  const { thisWeek, lastWeek } = data
  const week = new Date(data.weekStart).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', timeZone: 'UTC',
  })

  return (
    <Card className="mb-3.5">
      <CardHeader
        title={t('discipline.weekTitle')}
        subtitle={t('discipline.weekSubtitle', { week, days: data.tradingDays })}
      />

      {thisWeek.totalTrades === 0 ? (
        <p className="text-xs text-content-muted py-6 text-center">{t('discipline.weekEmpty')}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="flex flex-col gap-1.5">
              <Stat label={t('discipline.weekR')} tone={thisWeek.netR >= 0 ? 'positive' : 'negative'}>
                {fmtR(thisWeek.netR)}
              </Stat>
              <Delta value={thisWeek.netR - lastWeek.netR} format={fmtR} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Stat label={t('discipline.weekPnl')} tone={data.netPnL >= 0 ? 'positive' : 'negative'}>
                {fmtPnl(data.netPnL)}
              </Stat>
              <Delta value={data.netPnL - data.lastWeekNetPnL} format={fmtPnl} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Stat label={t('discipline.weekTrades')}>{fmt(thisWeek.totalTrades)}</Stat>
              <Delta value={thisWeek.totalTrades - lastWeek.totalTrades} format={n => fmt(n)} />
            </div>
            <div className="flex flex-col gap-1.5">
              {/* L'aderenza è l'unica di queste quattro su cui hai il controllo
                  diretto lunedì mattina: le altre tre sono il risultato. */}
              <Stat label={t('discipline.weekAdherence')}>{fmtPct(data.adherence, 0)}</Stat>
              <Delta value={data.adherence - data.lastWeekAdherence} format={n => fmtPct(n, 0)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-line">
            <div>
              <h3 className="text-2xs text-content-muted uppercase tracking-[0.08em] mb-2">
                {t('discipline.slipped')}
              </h3>
              {data.slippedRules.length === 0 ? (
                <p className="text-xs text-pos">{t('discipline.slippedNone')}</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {data.slippedRules.slice(0, 4).map(r => (
                    <li key={`${r.strategyName}-${r.label}`} className="flex items-baseline justify-between gap-3">
                      <span className="text-xs text-content-secondary min-w-0 truncate">{r.label}</span>
                      <span className="text-2xs font-mono text-neg shrink-0">
                        {t('discipline.slippedCount', { skipped: r.timesSkipped, total: r.timesTotal })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3 className="text-2xs text-content-muted uppercase tracking-[0.08em] mb-2">
                {t('discipline.weekMistakes')}
              </h3>
              {data.mistakes.length === 0 ? (
                <p className="text-xs text-content-muted">{t('discipline.weekMistakesNone')}</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {data.mistakes.slice(0, 6).map(m => (
                    <Badge key={m.tag} tone="neg">
                      {m.tag} · {m.occurrences}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </Card>
  )
}
