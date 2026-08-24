import { Card, CardHeader, Skeleton, StatRow } from '../../../design-system'
import { useTilt } from '../../../hooks/useAnalytics'
import { t } from '../../../i18n'
import { fmtPct, fmtR } from '../../../lib/format'
import type { MetricsBlockDto } from '../../../types/analytics'

/**
 * Come si va **dopo** una perdita.
 *
 * È il numero che quasi nessuno guarda e che quasi tutti hanno: se il win rate
 * crolla nel trade subito successivo a uno stop, il problema non è la strategia
 * — è cosa succede nei dieci minuti dopo lo stop, e si risolve chiudendo il
 * portatile, non cambiando setup.
 *
 * Serve un minimo di trade per lato, altrimenti la differenza è rumore: due
 * trade dopo una perdita non dicono niente su come reagisci.
 */
const MIN_TRADES = 5

function Column({ title, block, accent }: { title: string; block: MetricsBlockDto; accent: string }) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5 mb-2">
        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${accent}`} aria-hidden="true" />
        <span className="text-2xs text-content-muted uppercase tracking-[0.08em] truncate">{title}</span>
      </div>
      <StatRow label={t('discipline.winRate')} className="py-1">{fmtPct(block.winRate, 1)}</StatRow>
      <StatRow
        label={t('insights.expectancy')}
        tone={block.expectancyR >= 0 ? 'positive' : 'negative'}
        className="py-1"
      >
        {fmtR(block.expectancyR)}
      </StatRow>
      <StatRow label={t('insights.tradesLabel')} className="py-1">{String(block.totalTrades)}</StatRow>
    </div>
  )
}

export default function TiltPanel() {
  const { data, isLoading } = useTilt()

  const enough =
    data !== undefined &&
    data.afterLoss.totalTrades >= MIN_TRADES &&
    data.baseline.totalTrades >= MIN_TRADES

  // Il confronto è col win rate generale, non con "dopo una vittoria": quello
  // che vuoi sapere è se dopo uno stop giochi peggio del tuo solito.
  const gap = data ? data.afterLoss.winRate - data.baseline.winRate : 0

  // "Rientri dopo N minuti" ha senso finché N è una manciata di minuti. Se fra
  // un trade e l'altro passano giorni, quella frase diventa una stranezza da
  // leggere — la fretta non c'entra, semplicemente non tradi tutti i giorni.
  const RUSH_MINUTES = 240
  const rushed = data !== undefined && data.medianMinutesAfterLoss <= RUSH_MINUTES

  return (
    <Card interactive>
      <CardHeader title={t('discipline.tiltTitle')} subtitle={t('discipline.tiltSubtitle')} />

      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : !data || !enough ? (
        <p className="text-xs text-content-muted py-6 text-center">
          {t('discipline.tiltNotEnough', { min: MIN_TRADES })}
        </p>
      ) : (
        <>
          {/* La frase prima delle colonne: se il divario è grande è l'unica cosa
              da leggere, e cercarla confrontando sei numeri è lavoro inutile. */}
          <p className="text-xs text-content-secondary leading-relaxed mb-3.5 pb-3.5 border-b border-line">
            {gap <= -10
              ? t(rushed ? 'discipline.tiltBadRushed' : 'discipline.tiltBad', {
                  points: fmtPct(Math.abs(gap), 0),
                  after: fmtPct(data.afterLoss.winRate, 0),
                  usual: fmtPct(data.baseline.winRate, 0),
                  minutes: data.medianMinutesAfterLoss,
                })
              : t('discipline.tiltFine', { after: fmtPct(data.afterLoss.winRate, 0) })}
          </p>

          <div className="flex gap-4">
            <Column title={t('discipline.afterLoss')} block={data.afterLoss} accent="bg-neg" />
            <div className="w-px bg-line shrink-0" />
            <Column title={t('discipline.afterWin')} block={data.afterWin} accent="bg-pos" />
            <div className="w-px bg-line shrink-0" />
            <Column title={t('discipline.baseline')} block={data.baseline} accent="bg-content-muted" />
          </div>
        </>
      )}
    </Card>
  )
}
