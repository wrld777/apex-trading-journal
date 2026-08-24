import { Card, CardHeader, Skeleton, StatRow } from '../../../design-system'
import { useRiskConsistency } from '../../../hooks/useAnalytics'
import { t } from '../../../i18n'
import { fmt, fmtPct } from '../../../lib/format'

/**
 * Quanto varia il rischio da un trade all'altro.
 *
 * È la domanda che tiene in piedi tutte le altre pagine. L'R ha senso come
 * unità solo se ogni R vale più o meno lo stesso: se un trade rischia cinque
 * volte l'altro, sommare R è come sommare metri e piedi, e ogni schermata di
 * questa app sta mentendo un po' senza dirtelo.
 *
 * La misura è il **coefficiente di variazione** e non la deviazione secca: su
 * size diverse la stessa deviazione in dollari significa cose diverse.
 */
const STEADY = 25
const ELASTIC = 50

export default function RiskPanel() {
  const { data, isLoading } = useRiskConsistency()

  const points = data?.points ?? []
  const maxRisk = Math.max(0, ...points.map(p => p.risk))
  // Solo gli ultimi: la deriva della size è una cosa recente, e trecento
  // barrette da un pixel non sono un grafico.
  const recent = points.slice(-40)

  const verdict = !data ? null
    : data.variationPct <= STEADY ? { key: 'discipline.riskSteady' as const, tone: 'text-pos' }
    : data.variationPct <= ELASTIC ? { key: 'discipline.riskDrifting' as const, tone: 'text-warn' }
    : { key: 'discipline.riskElastic' as const, tone: 'text-neg' }

  return (
    <Card interactive>
      <CardHeader title={t('discipline.riskTitle')} subtitle={t('discipline.riskSubtitle')} />

      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : !data || data.tradesWithRisk === 0 ? (
        <p className="text-xs text-content-muted py-6 text-center">{t('discipline.riskEmpty')}</p>
      ) : (
        <>
          <p className={`text-xs leading-relaxed mb-3.5 pb-3.5 border-b border-line ${verdict!.tone}`}>
            {t(verdict!.key, { pct: fmtPct(data.variationPct, 0) })}
          </p>

          {/* Ogni barretta è un trade, in ordine di tempo: la forma dice se la
              size cresce dopo le vincite, che è il modo più comune di perdere
              in una settimana quello che si è messo insieme in un mese.
              La larghezza è limitata: con dodici trade `flex-1` da solo produce
              blocchi larghi un dito, che somigliano a un istogramma di
              categorie invece che a una serie nel tempo. */}
          <div className="flex items-end gap-[3px] h-16 mb-3.5" aria-hidden="true">
            {recent.map((p, i) => (
              <div
                key={i}
                className={`flex-1 min-w-[2px] max-w-[10px] rounded-sm ${
                  p.rMultiple === null ? 'bg-content-faint'
                  : p.rMultiple >= 0 ? 'bg-pos/60' : 'bg-neg/60'
                }`}
                style={{ height: `${maxRisk > 0 ? Math.max(4, (p.risk / maxRisk) * 100) : 4}%` }}
              />
            ))}
          </div>
          <p className="sr-only">
            {t('discipline.riskAria', { count: recent.length, pct: fmtPct(data.variationPct, 0) })}
          </p>

          <StatRow label={t('discipline.riskMedian')}>${fmt(data.medianRisk, 0)}</StatRow>
          <StatRow label={t('discipline.riskRange')}>
            ${fmt(data.minRisk, 0)} – ${fmt(data.maxRisk, 0)}
          </StatRow>
          <StatRow label={t('discipline.riskVariation')}>{fmtPct(data.variationPct, 0)}</StatRow>
        </>
      )}
    </Card>
  )
}
