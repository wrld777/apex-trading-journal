import { Skeleton } from '../../design-system'
import { t } from '../../i18n'
import { fmt } from '../../lib/format'
import type { RuleImpactDto } from '../../types/analytics'

/**
 * Quanto pesa ogni regola sul win rate: differenza fra i trade in cui è stata
 * rispettata e quelli in cui è stata saltata.
 *
 * La barra ora parte dal **centro** e cresce a destra o a sinistra. Prima
 * partiva sempre da sinistra con larghezza pari al valore assoluto: una regola
 * che peggiorava il risultato di 40 punti disegnava esattamente la stessa barra
 * di una che lo migliorava di 40, e la differenza — cioè tutto il senso di
 * questa tabella — stava solo nella tinta.
 */
export default function RuleImpactBars({
  rules, isLoading,
}: { rules: RuleImpactDto[] | undefined; isLoading: boolean }) {
  if (isLoading) {
    return <div className="flex flex-col gap-2">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
  }
  if (!rules || rules.length === 0) {
    return <div className="py-8 text-center text-xs text-content-muted">{t('insights.noAdherence')}</div>
  }

  return (
    <div className="flex flex-col gap-1.5">
      {rules.map(r => {
        // impact ∈ [−100, 100]: metà larghezza per lato, quindi il fattore è 0,5.
        const half = Math.min(Math.abs(r.impact), 100) / 2
        const positive = r.impact >= 0
        return (
          <div key={r.strategyRuleId} className="flex items-center gap-3 px-3 py-2.5 rounded-md bg-surface-2 border border-line">
            <div className="flex-1 min-w-0">
              <div className="text-xs text-content truncate mb-1" title={r.label}>{r.label}</div>
              <div className="flex items-center gap-3 text-2xs font-mono">
                <span className="text-pos">✓ {r.timesRespected} · {fmt(r.winRateRespected, 0)}%</span>
                <span className="text-neg">✗ {r.timesViolated} · {fmt(r.winRateViolated, 0)}%</span>
              </div>
            </div>

            <div className="w-28 shrink-0 relative h-1.5 rounded-full bg-surface-3 overflow-hidden">
              {/* Il centro è lo zero: senza una tacca visibile, una barra corta
                  a destra e una corta a sinistra si confondono. */}
              <div className="absolute inset-y-0 left-1/2 w-px bg-line-control" />
              <div
                className={`absolute inset-y-0 rounded-full ${positive ? 'bg-pos/80' : 'bg-neg/80'}`}
                style={positive
                  ? { left: '50%', width: `${half}%` }
                  : { right: '50%', width: `${half}%` }}
              />
            </div>

            <div className={`w-14 text-right text-xs font-mono font-medium shrink-0 ${positive ? 'text-pos' : 'text-neg'}`}>
              {positive ? '+' : '−'}{fmt(Math.abs(r.impact), 0)}%
            </div>
          </div>
        )
      })}
    </div>
  )
}
