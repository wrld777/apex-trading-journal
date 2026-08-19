import { Badge, Card, CardHeader, Checkbox, Field, Meter, Select } from '../../../design-system'
import { t } from '../../../i18n'
import type { StrategyDto } from '../../../types/strategy'

/**
 * La strategia e la sua checklist (ADR 0003).
 *
 * Si registra **l'aderenza**, non la validità: una regola obbligatoria non
 * spuntata non blocca il salvataggio, perché l'esecuzione indisciplinata è
 * esattamente il dato che questa app esiste per raccogliere. Se il modulo la
 * rifiutasse, il caso più interessante non entrerebbe mai nei numeri.
 */
export default function StrategyChecklist({
  strategies, strategyId, onSelect, ruleChecks, onToggleRule,
}: {
  strategies: StrategyDto[]
  strategyId: string
  onSelect: (id: string) => void
  ruleChecks: Record<string, boolean>
  onToggleRule: (id: string) => void
}) {
  const selected = strategies.find(s => s.id === strategyId) ?? null
  const rules = selected?.rules ?? []
  const followed = rules.filter(r => ruleChecks[r.id]).length

  return (
    <Card>
      <CardHeader title={t('logTrade.sectionStrategy')} />
      <Field label={t('logTrade.strategy')}>
        <Select value={strategyId} onChange={e => onSelect(e.target.value)}>
          <option value="">{t('logTrade.noStrategy')}</option>
          {strategies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </Field>

      {!selected ? (
        <p className="text-2xs text-content-muted mt-3.5 leading-relaxed">{t('logTrade.strategyHint')}</p>
      ) : rules.length === 0 ? (
        <p className="text-2xs text-content-muted mt-3.5">{t('logTrade.strategyNoRules')}</p>
      ) : (
        <div className="mt-3.5">
          <div className="divide-y divide-line">
            {rules.map(rule => (
              <Checkbox
                key={rule.id}
                checked={!!ruleChecks[rule.id]}
                onChange={() => onToggleRule(rule.id)}
                label={rule.label}
                trailing={rule.required ? <Badge tone="warn" className="ml-auto">{t('strategies.required')}</Badge> : undefined}
              />
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-line flex items-center gap-3">
            <span className="text-2xs text-content-faint font-mono shrink-0">
              {t('logTrade.followedCount', { done: followed, total: rules.length })}
            </span>
            <Meter value={(followed / rules.length) * 100} tone="bg-pos" label={t('logTrade.adherenceAria')} />
          </div>
        </div>
      )}
    </Card>
  )
}
