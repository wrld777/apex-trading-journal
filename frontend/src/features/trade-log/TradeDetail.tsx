import { ArrowLeft, Check, Minus, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import TradeStatusBadge from '../../components/TradeStatusBadge'
import {
  Badge, Button, Card, CardHeader, Modal, PageHeader, Skeleton, StatCard, StatRow,
  TBody, TD, TH, THead, TR, Table, TableWrap,
} from '../../design-system'
import { useDeleteTrade, useTrade } from '../../hooks/useTrades'
import { DATE_LOCALE, fmt, fmtPnl, fmtR } from '../../lib/format'
import { t } from '../../i18n'
import { useToastStore } from '../../store/toastStore'
import type { TradeDto, TradeOutcome } from '../../types/trade'

/**
 * Un trade, per intero e in sola lettura.
 *
 * Prima non esisteva: per rivedere un trade vecchio si apriva **Modifica**, cioè
 * si entrava in un modulo per fare una cosa che non è modificare. Gli screenshot,
 * l'aderenza alla checklist e le uscite parziali non avevano proprio un posto in
 * cui essere guardati — il modale ne mostrava una parte, e nel formato sbagliato.
 *
 * Qui si legge; per correggere c'è un bottone che porta allo stesso modulo con
 * cui il trade è stato scritto.
 */

const OUTCOME_LABELS: Record<TradeOutcome, string> = {
  TakeProfit: t('tradeLog.exitTp'),
  StopLoss: t('tradeLog.exitSl'),
  BreakEven: t('tradeLog.exitBe'),
  Manual: t('logTrade.outcomeManual'),
}

function fmtDateTime(iso: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.toLocaleDateString(DATE_LOCALE, { year: 'numeric', month: 'short', day: 'numeric' })} · ${iso.slice(11, 16)}`
}

/** Quanto è durato. Senza orario di uscita non è calcolabile, e si dice. */
function holdTime(trade: TradeDto) {
  if (!trade.exitTime) return '—'
  const minutes = Math.round(
    (new Date(trade.exitTime).getTime() - new Date(trade.entryTime).getTime()) / 60_000,
  )
  if (minutes < 0) return '—'
  if (minutes < 60) return t('tradeDetail.minutes', { count: minutes })
  const hours = Math.floor(minutes / 60)
  return t('tradeDetail.hoursMinutes', { hours, minutes: minutes % 60 })
}

/** Una voce dell'aderenza: rispettata, saltata, e se era obbligatoria. */
function RuleLine({ label, checked, required }: { label: string; checked: boolean; required?: boolean | null }) {
  return (
    <li className="flex items-start gap-2 py-1.5 border-b border-line last:border-0">
      <span
        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border ${
          checked ? 'bg-pos/10 border-pos/30 text-pos' : 'bg-neg/10 border-neg/30 text-neg'
        }`}
        aria-hidden="true"
      >
        {checked ? <Check className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
      </span>
      {/* Stessa lettura del modulo: rispettata in evidenza, saltata più quieta.
          Far cambiare significato all'enfasi fra le due schermate, sullo stesso
          dato, costringerebbe a reimparare la pagina. Che una regola sia stata
          saltata lo dice il segno rosso, che è più forte di qualsiasi grigio. */}
      <span className={`text-xs leading-snug ${checked ? 'text-content-strong' : 'text-content-muted'}`}>
        {label}
        {required && <Badge tone="outline" className="ml-1.5 align-middle">{t('tradeDetail.required')}</Badge>}
      </span>
      <span className="sr-only">{checked ? t('tradeDetail.followed') : t('tradeDetail.skipped')}</span>
    </li>
  )
}

export default function TradeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: trade, isLoading, isError } = useTrade(id)
  const { mutate: deleteTrade, isPending: isDeleting } = useDeleteTrade()
  const addToast = useToastStore(s => s.addToast)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3.5">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  if (isError || !trade) {
    return (
      <Card className="text-center py-10">
        <p className="text-xs text-neg mb-3">{t('tradeDetail.loadFailed')}</p>
        <Button onClick={() => navigate('/trades')}>{t('tradeDetail.backToLog')}</Button>
      </Card>
    )
  }

  const exits = trade.exits ?? []
  const checks = [...(trade.ruleChecks ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const followed = checks.filter(c => c.checked).length

  const remove = () => {
    deleteTrade(trade.id, {
      onSuccess: () => {
        addToast(t('tradeDetail.deleted'), 'success')
        navigate('/trades')
      },
      onError: (err: unknown) => {
        addToast(err instanceof Error ? err.message : t('tradeDetail.deleteFailed'), 'error')
      },
    })
  }

  return (
    <>
      <PageHeader
        title={`${trade.symbol} · ${trade.direction === 'Long' ? t('tradeLog.sideLong') : t('tradeLog.sideShort')}`}
        subtitle={
          <span className="inline-flex items-center gap-2">
            {fmtDateTime(trade.entryTime)}
            <TradeStatusBadge status={trade.status} />
            {trade.strategyName && <Badge tone="brand">{trade.strategyName}</Badge>}
          </span>
        }
        actions={
          <>
            <Link
              to="/trades"
              className="inline-flex items-center gap-1.5 rounded-md border border-line-2 px-2.5 py-1.5 text-2xs text-content-secondary hover:bg-surface-3 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              {t('tradeDetail.backToLog')}
            </Link>
            <Button variant="primary" onClick={() => navigate(`/trades/${trade.id}/edit`)}>
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              {t('common.edit')}
            </Button>
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              {t('common.delete')}
            </Button>
          </>
        }
      />

      {/* I quattro numeri che dicono com'è andata. L'R per primo: è il metro con
          cui si confrontano due trade di size diversa (#106). */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-3.5">
        <StatCard
          label={t('tradeDetail.rMultiple')}
          tone={trade.rMultiple === null ? 'muted' : trade.rMultiple >= 0 ? 'positive' : 'negative'}
          hint={t('tradeDetail.rHint')}
        >
          {trade.rMultiple === null ? '—' : fmtR(trade.rMultiple)}
        </StatCard>
        <StatCard label={t('tradeDetail.pnl')} tone={trade.pnL >= 0 ? 'positive' : 'negative'}>
          {fmtPnl(trade.pnL)}
        </StatCard>
        <StatCard label={t('tradeLog.colRr')} hint={t('tradeDetail.rrHint')}>
          {fmt(trade.riskReward, 2)}
        </StatCard>
        <StatCard label={t('tradeDetail.holdTime')}>{holdTime(trade)}</StatCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        <div className="flex flex-col gap-3.5">
          <Card>
            <CardHeader title={t('tradeDetail.execution')} />
            <StatRow label={t('tradeDetail.instrument')}>{trade.symbol}</StatRow>
            <StatRow label={t('tradeDetail.quantity')}>{fmt(trade.quantity)}</StatRow>
            <StatRow label={t('tradeDetail.entryPrice')}>{fmt(trade.entryPrice, 2)}</StatRow>
            <StatRow label={t('tradeDetail.stopLoss')}>{fmt(trade.stopLoss, 2)}</StatRow>
            <StatRow label={t('tradeDetail.takeProfit')}>{trade.takeProfit ? fmt(trade.takeProfit, 2) : '—'}</StatRow>
            {/* Sui parziali questo è una media pesata, non un prezzo battuto:
                il dettaglio vero è la tabella delle uscite qui sotto. */}
            <StatRow label={t('tradeDetail.avgExit')}>{fmt(trade.exitPrice, 2)}</StatRow>
            <StatRow label={t('tradeDetail.entryTime')}>{fmtDateTime(trade.entryTime)}</StatRow>
            <StatRow label={t('tradeDetail.exitTime')}>{fmtDateTime(trade.exitTime)}</StatRow>
          </Card>

          <Card padding="flush">
            <div className="p-4 lg:p-5 pb-0">
              <CardHeader
                title={t('tradeLog.exits')}
                subtitle={exits.length > 1 ? t('tradeDetail.scaledOut', { count: exits.length }) : undefined}
              />
            </div>
            <TableWrap>
              <Table>
                <THead>
                  <tr className="border-b border-line">
                    <TH>{t('tradeDetail.colOutcome')}</TH>
                    <TH numeric>{t('tradeDetail.colContracts')}</TH>
                    <TH numeric>{t('tradeDetail.colPrice')}</TH>
                    <TH numeric>{t('tradeDetail.colWhen')}</TH>
                  </tr>
                </THead>
                <TBody>
                  {exits.map((e, i) => (
                    <TR key={i}>
                      <TD>{OUTCOME_LABELS[e.outcome]}</TD>
                      <TD numeric>{fmt(e.contracts)}</TD>
                      <TD numeric>{fmt(e.price, 2)}</TD>
                      <TD numeric>{e.time ? fmtDateTime(e.time) : '—'}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </TableWrap>
          </Card>

          <Card>
            <CardHeader title={t('logTrade.sectionContext')} />
            <StatRow label={t('logTrade.session')}>{trade.session || '—'}</StatRow>
            <StatRow label={t('logTrade.setup')}>{trade.setup || '—'}</StatRow>
            <StatRow label={t('logTrade.htfBias')}>{trade.htfBias || '—'}</StatRow>
            <StatRow label={t('logTrade.grade')}>{trade.grade || '—'}</StatRow>
            <StatRow label={t('logTrade.emotionalState')}>{trade.emotionalState || '—'}</StatRow>
            {trade.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-3">
                {trade.tags.map(tag => <Badge key={tag} tone="outline">{tag}</Badge>)}
              </div>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-3.5">
          {/* L'aderenza è il motivo per cui questa app esiste (ADR 0003): quali
              regole erano rispettate su *questo* trade. Finora era registrata e
              mai mostrata. */}
          {checks.length > 0 && (
            <Card>
              <CardHeader
                title={t('tradeDetail.adherence')}
                subtitle={t('tradeDetail.adherenceCount', { done: followed, total: checks.length })}
              />
              <ul>
                {checks.map(c => (
                  <RuleLine
                    key={c.strategyRuleId}
                    label={c.label ?? c.strategyRuleId}
                    checked={c.checked}
                    required={c.required}
                  />
                ))}
              </ul>
            </Card>
          )}

          {trade.screenshots.length > 0 && (
            <Card>
              <CardHeader title={t('logTrade.sectionScreenshot')} />
              <div className="flex flex-col gap-2">
                {trade.screenshots.map(url => (
                  <a key={url} href={url} target="_blank" rel="noreferrer" className="block rounded-md overflow-hidden border border-line hover:border-line-2 transition-colors">
                    <img src={url} alt={t('screenshot.alt')} className="w-full h-auto" loading="lazy" />
                  </a>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <CardHeader title={t('logTrade.sectionNotes')} />
            <div className="flex flex-col gap-3.5">
              <div>
                <span className="text-2xs text-content-muted uppercase tracking-[0.08em] block mb-1">{t('logTrade.rationale')}</span>
                <p className="text-xs text-content-secondary leading-relaxed whitespace-pre-wrap">{trade.rationale || '—'}</p>
              </div>
              <div>
                <span className="text-2xs text-content-muted uppercase tracking-[0.08em] block mb-1">{t('logTrade.mistakes')}</span>
                <p className="text-xs text-content-secondary leading-relaxed whitespace-pre-wrap">{trade.mistakes || '—'}</p>
                {/* Le etichette sotto al racconto, non al posto suo: qui servono
                    a riconoscere l'errore che torna, in Disciplina a contarlo. */}
                {trade.mistakeTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {trade.mistakeTags.map(tag => <Badge key={tag} tone="neg">{tag}</Badge>)}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={confirmDelete}
        onClose={() => { if (!isDeleting) setConfirmDelete(false) }}
        title={t('tradeLog.deleteTitle')}
        maxWidth="max-w-sm"
        footer={
          <>
            <Button onClick={() => setConfirmDelete(false)} disabled={isDeleting}>{t('common.cancel')}</Button>
            <Button variant="danger" onClick={remove} loading={isDeleting}>
              {isDeleting ? t('common.deleting') : t('common.delete')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-content-secondary leading-relaxed">
          {t('tradeLog.deleteBody', {
            symbol: trade.symbol,
            direction: trade.direction,
            date: new Date(trade.entryTime).toLocaleDateString(DATE_LOCALE, { year: '2-digit', month: 'short', day: 'numeric' }),
          })}
        </p>
      </Modal>
    </>
  )
}
