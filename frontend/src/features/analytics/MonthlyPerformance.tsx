import { useState } from 'react'

import { Card, CardHeader, Select, Skeleton, TBody, TD, TH, THead, TR, Table, TableWrap } from '../../design-system'
import { useMonthly } from '../../hooks/useAnalytics'
import { useStrategies } from '../../hooks/useStrategies'
import { t } from '../../i18n'
import { DATE_LOCALE, fmt, fmtPct, fmtPnl, fmtR } from '../../lib/format'
import { fmtMargin } from '../../lib/confidence'

/**
 * Mese per mese: come sta andando, e come sta andando **una** strategia.
 *
 * Il cumulativo e il calendario non rispondono a questa domanda. Il primo
 * nasconde un mese storto dentro una curva che sale; il secondo mostra un mese
 * solo, quello corrente, e mescola tutte le strategie. Qui ogni riga è un mese e
 * il filtro in alto isola la strategia — che è il modo in cui la si valuta:
 * "questo trimestre regge o no".
 *
 * Il risultato è in **R**, con i dollari accanto. Una percentuale di rendimento
 * richiederebbe un capitale di riferimento, e il capitale è esattamente ciò che
 * la #106 ha tolto: l'R è la stessa misura, ma indipendente dalla size.
 */

function monthLabel(iso: string) {
  // Lette come UTC: il primo del mese in fuso negativo diventerebbe il 31 del
  // mese prima, cioè l'etichetta sbagliata su ogni riga.
  const d = new Date(iso)
  return d.toLocaleDateString(DATE_LOCALE, { month: 'short', year: 'numeric', timeZone: 'UTC' })
}

/** La barra dice il segno e la grandezza relativa: la colonna di numeri da sola
 *  non fa vedere quale mese ha fatto la differenza. */
function RBar({ value, max }: { value: number; max: number }) {
  const width = max > 0 ? Math.min(100, (Math.abs(value) / max) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-1.5 w-full min-w-[60px] rounded-full bg-surface-3" aria-hidden="true">
        <div
          className={`absolute top-0 h-full rounded-full ${value >= 0 ? 'bg-pos left-1/2' : 'bg-neg right-1/2'}`}
          style={{ width: `${width / 2}%` }}
        />
        <div className="absolute inset-y-0 left-1/2 w-px bg-line-2" />
      </div>
      <span className={`font-mono text-2xs shrink-0 w-[64px] text-right ${value >= 0 ? 'text-pos' : 'text-neg'}`}>
        {fmtR(value)}
      </span>
    </div>
  )
}

export default function MonthlyPerformance() {
  const [strategyId, setStrategyId] = useState('')
  const { data: strategies = [] } = useStrategies()
  const { data: months = [], isLoading, isError } = useMonthly(strategyId || undefined)

  const maxR = Math.max(0, ...months.map(m => Math.abs(m.metrics.netR)))
  const totalTrades = months.reduce((sum, m) => sum + m.metrics.totalTrades, 0)
  const totalR = months.reduce((sum, m) => sum + m.metrics.netR, 0)
  const totalPnl = months.reduce((sum, m) => sum + m.netPnL, 0)

  return (
    <Card interactive className="mb-3.5">
      <CardHeader
        title={t('monthly.title')}
        subtitle={t('monthly.hint')}
        action={
          <Select
            value={strategyId}
            onChange={e => setStrategyId(e.target.value)}
            aria-label={t('monthly.strategyAria')}
            wrapperClassName="w-[200px]"
          >
            <option value="">{t('monthly.allStrategies')}</option>
            {strategies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        }
      />

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-7 w-full" />)}
        </div>
      ) : isError ? (
        <p className="text-xs text-neg py-6 text-center">{t('monthly.loadFailed')}</p>
      ) : months.length === 0 ? (
        <p className="text-xs text-content-muted py-6 text-center">{t('monthly.empty')}</p>
      ) : (
        <TableWrap>
          <Table className="min-w-[620px]">
            <THead>
              <tr className="border-b border-line">
                <TH>{t('monthly.colMonth')}</TH>
                <TH numeric>{t('monthly.colTrades')}</TH>
                <TH numeric>{t('monthly.colWinRate')}</TH>
                <TH numeric>{t('monthly.colExpectancy')}</TH>
                <TH className="w-[220px]">{t('monthly.colNetR')}</TH>
                <TH numeric>{t('monthly.colNetPnl')}</TH>
              </tr>
            </THead>
            <TBody>
              {months.map(m => (
                <TR key={m.month}>
                  <TD className="text-content-strong whitespace-nowrap">{monthLabel(m.month)}</TD>
                  <TD numeric>{fmt(m.metrics.totalTrades)}</TD>
                  <TD numeric>{fmtPct(m.metrics.winRate, 1)}</TD>
                  <TD numeric>
                    {fmtR(m.metrics.expectancyR)}
                    {m.metrics.expectancyRStdErr > 0 && (
                      <span className="text-content-faint"> {fmtMargin(m.metrics.expectancyRStdErr)}</span>
                    )}
                  </TD>
                  <TD><RBar value={m.metrics.netR} max={maxR} /></TD>
                  <TD numeric className={m.netPnL >= 0 ? 'text-pos' : 'text-neg'}>{fmtPnl(m.netPnL)}</TD>
                </TR>
              ))}
              <TR className="border-t border-line-2 hover:bg-transparent">
                <TD className="text-content-strong">{t('monthly.total')}</TD>
                <TD numeric>{fmt(totalTrades)}</TD>
                <TD numeric>—</TD>
                <TD numeric>—</TD>
                <TD>
                  <span className={`font-mono text-2xs ${totalR >= 0 ? 'text-pos' : 'text-neg'}`}>{fmtR(totalR)}</span>
                </TD>
                <TD numeric className={totalPnl >= 0 ? 'text-pos' : 'text-neg'}>{fmtPnl(totalPnl)}</TD>
              </TR>
            </TBody>
          </Table>
        </TableWrap>
      )}
    </Card>
  )
}
