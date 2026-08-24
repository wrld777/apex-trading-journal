import { Card, CardHeader, Skeleton, TBody, TD, TH, THead, TR, Table, TableWrap } from '../../../design-system'
import { useMistakeImpact } from '../../../hooks/useAnalytics'
import { t } from '../../../i18n'
import { fmt, fmtPct, fmtPnl, fmtR } from '../../../lib/format'

/**
 * Quanto costa ogni errore, contato invece che raccontato.
 *
 * Il campo note del trade resta il racconto — *"revenge trade dopo la perdita
 * di ieri"* — ed è la cosa giusta da scrivere. Ma una frase in un campo di
 * testo non si somma: finché gli errori vivevano solo lì, non c'era modo di
 * sapere che quello è successo sette volte e che è costato sei R.
 *
 * La colonna che conta è **l'ultima**: non il risultato dei trade sbagliati —
 * anche un trade con un errore può chiudere in guadagno — ma la differenza fra
 * come vai con quell'errore e come vai senza.
 */
export default function MistakesPanel() {
  const { data = [], isLoading } = useMistakeImpact()

  return (
    <Card interactive className="mb-3.5">
      <CardHeader title={t('discipline.mistakesTitle')} subtitle={t('discipline.mistakesSubtitle')} />

      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : data.length === 0 ? (
        <p className="text-xs text-content-muted py-6 text-center leading-relaxed">
          {t('discipline.mistakesEmpty')}
        </p>
      ) : (
        <TableWrap>
          <Table className="min-w-[560px]">
            <THead>
              <tr className="border-b border-line">
                <TH>{t('discipline.colMistake')}</TH>
                <TH numeric>{t('discipline.colTimes')}</TH>
                <TH numeric>{t('discipline.colWinRate')}</TH>
                <TH numeric>{t('discipline.colNetR')}</TH>
                <TH numeric>{t('discipline.colNetPnl')}</TH>
                <TH numeric>{t('discipline.colCost')}</TH>
              </tr>
            </THead>
            <TBody>
              {data.map(m => (
                <TR key={m.tag}>
                  <TD className="text-content-strong">{m.tag}</TD>
                  <TD numeric>{fmt(m.occurrences)}</TD>
                  <TD numeric>{fmtPct(m.winRate, 0)}</TD>
                  <TD numeric className={m.netR >= 0 ? 'text-pos' : 'text-neg'}>{fmtR(m.netR)}</TD>
                  <TD numeric className={m.netPnL >= 0 ? 'text-pos' : 'text-neg'}>{fmtPnl(m.netPnL)}</TD>
                  <TD numeric className={m.avgRDelta < 0 ? 'text-neg' : 'text-content-secondary'}>
                    {fmtR(m.avgRDelta)}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </TableWrap>
      )}
    </Card>
  )
}
