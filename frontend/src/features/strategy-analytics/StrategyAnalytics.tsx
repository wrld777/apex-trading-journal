import { useMemo, useState } from 'react'

import { t } from '../../i18n'

import { useDiscipline, useRuleImpact, useStrategyStats } from '../../hooks/useAnalytics'
import type {
  Granularity,
  MetricsBlockDto,
  StrategyStatsDto,
} from '../../types/analytics'
import { fmt, fmtPnl, fmtR, pnlColor } from '../../lib/format'
import { Card, CardHeader, EmptyState, PageHeader, Select, Skeleton, StatRow, Tooltip } from '../../design-system'
import { DisciplineChart, RuleImpactBars } from '../../components/charts'

/* ── METRIC COLUMN (one of Overall / Adherent / Not adherent) ── */
function MetricColumn({ title, block, accent }: { title: string; block: MetricsBlockDto; accent: string }) {
  const empty = block.totalTrades === 0
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5 mb-2">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${accent}`} />
        <span className="text-2xs text-content-secondary uppercase tracking-widest truncate">{title}</span>
      </div>
      {empty ? (
        <div className="text-content-faint text-lg font-mono font-medium">—</div>
      ) : (
        <>
          <div className="font-mono font-medium text-xl leading-none text-content-strong mb-1.5">{fmt(block.winRate, 1)}%</div>
          <div className="flex flex-col">
            {/* L'expectancy in R viene prima: è quella con cui si confrontano
                due strategie. I dollari restano sotto come riferimento. */}
            <StatRow label={t('insights.expectancy')} tone={block.expectancyR >= 0 ? 'positive' : 'negative'} className="py-1">
              {fmtR(block.expectancyR)}
            </StatRow>
            <StatRow label={t('insights.inDollars')} tone="muted" className="py-1">{fmtPnl(block.expectancy)}</StatRow>
            <StatRow label={t('insights.avgRR')} className="py-1">{fmt(block.avgRR, 2)}</StatRow>
            <StatRow label={t('insights.tradesLabel')} className="py-1">{String(block.totalTrades)}</StatRow>
          </div>
        </>
      )}
    </div>
  )
}

/* ── VERDICT: disciplined execution vs weak strategy ── */
function verdict(s: StrategyStatsDto): { text: string; cls: string } | null {
  const a = s.whenFullyAdherent
  const n = s.whenNotAdherent
  // Need enough signal on both sides to say anything meaningful.
  if (a.totalTrades < 2 || n.totalTrades < 2) return null
  const delta = a.winRate - n.winRate
  if (delta >= 15) {
    return { text: t('insights.verdictDisciplined'), cls: 'bg-warn/10 border-warn/20 text-warn' }
  }
  // Il caso opposto mancava e finiva in "allineati", che è la lettura più
  // sbagliata possibile: se rispettare la checklist va *peggio* che ignorarla,
  // il problema è nelle regole, non nell'esecuzione. È il caso più interessante.
  if (delta <= -15) {
    return { text: t('insights.verdictInverted'), cls: 'bg-brand/10 border-brand/20 text-brand' }
  }
  if (a.winRate < 45 && n.winRate < 45) {
    return { text: t('insights.verdictWeak'), cls: 'bg-neg/10 border-neg/20 text-neg' }
  }
  return { text: t('insights.verdictAligned'), cls: 'bg-neutral2/10 border-white/10 text-content-secondary' }
}

/* ── STRATEGY CARD ── */
function StrategyCard({ s }: { s: StrategyStatsDto }) {
  const v = verdict(s)
  return (
    <Card interactive>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-medium text-content-strong truncate">{s.strategyName}</div>
        <Tooltip content={t('insights.expTitle', { value: fmtPnl(s.overall.expectancy) })}>
          <span className={`text-xs font-mono ${pnlColor(s.overall.expectancyR)}`}>
            {t('insights.expShort', { value: fmtR(s.overall.expectancyR) })}
          </span>
        </Tooltip>
      </div>
      <div className="flex gap-3">
        <MetricColumn title={t('insights.all')} block={s.overall} accent="bg-content-muted" />
        <div className="w-px bg-white/[0.05]" />
        <MetricColumn title={t('insights.fullChecklist')} block={s.whenFullyAdherent} accent="bg-pos" />
        <div className="w-px bg-white/[0.05]" />
        <MetricColumn title={t('insights.rulesSkipped')} block={s.whenNotAdherent} accent="bg-neg" />
      </div>
      {v && (
        <div className={`mt-4 px-3 py-2 rounded-md border text-xs ${v.cls}`}>{v.text}</div>
      )}
    </Card>
  )
}

/* ── MAIN ── */
export default function StrategyAnalytics() {
  const { data: strategies, isLoading, isError } = useStrategyStats()
  const [selectedId, setSelectedId] = useState<string>('')
  const [gran, setGran] = useState<Granularity>('week')

  // Default the rule-impact selector to the first strategy with trades.
  const activeId = selectedId || strategies?.[0]?.strategyId || ''
  const { data: rules, isLoading: rulesLoading } = useRuleImpact(activeId || undefined)
  const { data: discipline, isLoading: discLoading } = useDiscipline(gran)

  const activeName = useMemo(
    () => strategies?.find(s => s.strategyId === activeId)?.strategyName ?? '',
    [strategies, activeId],
  )

  return (
    <>
      <PageHeader
        title={t('insights.title')}
        subtitle={t('insights.subtitle', { count: strategies?.length ?? 0 })}
      />

      {isError && (
        <div className="mb-4 px-4 py-3 rounded-md bg-neg/10 border border-neg/20 text-neg text-xs">
          {t('insights.loadFailed')}
        </div>
      )}

      {/* Per-strategy cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 mb-3.5">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-[190px] w-full rounded-[10px]" />)}
        </div>
      ) : !strategies || strategies.length === 0 ? (
        <Card className="mb-3.5">
          <EmptyState
            title={t('insights.emptyTitle')}
            description={t('insights.emptyBody')}
            actionLabel={t('nav.logTrade')}
            actionTo="/log-trade"
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 mb-3.5">
          {strategies.map(s => <StrategyCard key={s.strategyId} s={s} />)}
        </div>
      )}

      {/* Rule impact + Discipline trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {/* Rule impact */}
        <Card interactive>
          <CardHeader
            title={t('insights.ruleImpact')}
            subtitle={strategies && strategies.length > 0 ? t('insights.ruleImpactHint', { name: activeName || t('common.rule') }) : undefined}
            action={strategies && strategies.length > 0 && (
              <Select
                value={activeId}
                onChange={e => setSelectedId(e.target.value)}
                className="w-auto text-xs"
                aria-label={t('insights.strategyAria')}
              >
                {strategies.map(s => <option key={s.strategyId} value={s.strategyId}>{s.strategyName}</option>)}
              </Select>
            )}
          />
          {!strategies || strategies.length === 0 ? (
            <div className="py-8 text-center text-xs text-content-muted">—</div>
          ) : (
            <RuleImpactBars rules={rules} isLoading={rulesLoading} />
          )}
        </Card>

        {/* Discipline trend */}
        <Card interactive>
          <CardHeader
            title={t('insights.disciplineTrend')}
            action={
              <div className="flex items-center gap-1 bg-surface-2 border border-line-2 rounded-md p-0.5">
                {(['week', 'month'] as Granularity[]).map(g => (
                  <button
                    key={g}
                    onClick={() => setGran(g)}
                    aria-pressed={gran === g}
                    className={`px-2.5 py-1 rounded text-2xs uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 ${
                      gran === g ? 'bg-surface-3 text-content-strong' : 'text-content-muted hover:text-content-secondary'
                    }`}
                  >
                    {g === 'week' ? t('insights.week') : t('insights.month')}
                  </button>
                ))}
              </div>
            }
          />
          {discLoading ? <Skeleton className="h-[180px] w-full" /> : <DisciplineChart points={discipline ?? []} />}
        </Card>
      </div>
    </>
  )
}
