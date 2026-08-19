import { Trash2 } from 'lucide-react'

import { Button, Card, CardHeader, Field, IconButton, Input, SegmentedControl, Select } from '../../../design-system'
import { t } from '../../../i18n'
import type { TradeOutcome } from '../../../types/trade'
import type { FormErrors, FormState, PartialDraft } from '../schema'

/**
 * Come si è usciti (#96).
 *
 * Si ragiona per **esito**, non per prezzo: il prezzo di TP, SL e pareggio è
 * già nei campi del trade e lo deriva il server. Il prezzo si scrive solo per
 * un'uscita manuale, che è l'unico caso in cui non è ricavabile.
 */

/** TP e SL non sono selezionabili senza il loro livello: meglio un comando
 *  spento di un invio che fallisce lato server. */
function outcomeOptions(form: FormState) {
  return [
    { value: 'TakeProfit' as const, label: t('logTrade.outcomeTakeProfit'), hint: t('logTrade.hintTakeProfit'), disabled: !form.takeProfit },
    { value: 'StopLoss' as const,   label: t('logTrade.outcomeStopLoss'),   hint: t('logTrade.hintStopLoss'),   disabled: !form.stopLoss },
    { value: 'BreakEven' as const,  label: t('logTrade.outcomeBreakEven'),  hint: t('logTrade.hintBreakEven') },
    { value: 'Manual' as const,     label: t('logTrade.outcomeManual'),     hint: t('logTrade.hintManual') },
  ]
}

export default function ExitPlan({
  form, errors, onField, outcome, onOutcome,
  partialsOpen, onTogglePartials, partials, onPartialChange, onAddPartial, onRemovePartial,
}: {
  form: FormState
  errors: FormErrors
  onField: (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => void
  outcome: TradeOutcome | ''
  onOutcome: (o: TradeOutcome) => void
  partialsOpen: boolean
  onTogglePartials: () => void
  partials: PartialDraft[]
  onPartialChange: (key: string, patch: Partial<PartialDraft>) => void
  onAddPartial: () => void
  onRemovePartial: (key: string) => void
}) {
  const priceStep = '0.25'
  const quantity = parseInt(form.quantity, 10) || 0
  const contracts = partials.reduce((sum, p) => sum + (parseInt(p.contracts, 10) || 0), 0)
  const balanced = quantity > 0 && contracts === quantity

  const levelLabel =
    outcome === 'TakeProfit' ? t('logTrade.levelTakeProfit', { price: form.takeProfit || '—' })
    : outcome === 'StopLoss' ? t('logTrade.levelStopLoss', { price: form.stopLoss || '—' })
    : t('logTrade.levelEntry', { price: form.entryPrice || '—' })

  return (
    <Card>
      <CardHeader
        title={t('logTrade.exitSection')}
        action={
          <button
            type="button"
            onClick={onTogglePartials}
            className="text-2xs text-content-secondary hover:text-content transition-colors underline underline-offset-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
          >
            {partialsOpen ? t('logTrade.backToSingleExit') : t('logTrade.scaledOut')}
          </button>
        }
      />

      {!partialsOpen ? (
        <>
          <SegmentedControl<TradeOutcome>
            value={outcome}
            onChange={onOutcome}
            label={t('logTrade.exitSection')}
            size="md"
            options={outcomeOptions(form)}
            tone={() => 'bg-brand text-brand-ink'}
            className="mb-3 flex-wrap"
          />

          {outcome === 'Manual' ? (
            <Field label={t('logTrade.exitPrice')} required error={errors.exitPrice} className="max-w-[220px]">
              <Input type="number" numeric placeholder="0.00" value={form.exitPrice} onChange={onField('exitPrice')} step={priceStep} />
            </Field>
          ) : outcome !== '' ? (
            <p className="text-2xs text-content-muted">{t('logTrade.derivedPrice', { level: levelLabel })}</p>
          ) : (
            <p className={`text-2xs ${errors.outcome ? 'text-neg' : 'text-content-muted'}`} role={errors.outcome ? 'alert' : undefined}>
              {errors.outcome ?? t('logTrade.chooseOutcome')}
            </p>
          )}
        </>
      ) : (
        <div className="flex flex-col gap-2">
          {partials.map((p, i) => (
            <div key={p.key} className="flex items-center gap-2">
              <Select
                value={p.outcome}
                onChange={e => onPartialChange(p.key, { outcome: e.target.value as TradeOutcome })}
                aria-label={t('logTrade.exitOutcomeAria', { n: i + 1 })}
                wrapperClassName="w-[130px] shrink-0"
              >
                {outcomeOptions(form).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
              <Input
                type="number" numeric min="1"
                placeholder={t('logTrade.contractsPlaceholder')}
                value={p.contracts}
                onChange={e => onPartialChange(p.key, { contracts: e.target.value })}
                aria-label={t('logTrade.exitContractsAria', { n: i + 1 })}
                className="w-[110px] shrink-0"
              />
              {p.outcome === 'Manual' && (
                <Input
                  type="number" numeric step={priceStep}
                  placeholder={t('logTrade.pricePlaceholder')}
                  value={p.price}
                  onChange={e => onPartialChange(p.key, { price: e.target.value })}
                  aria-label={t('logTrade.exitPriceAria', { n: i + 1 })}
                  className="w-[130px] shrink-0"
                />
              )}
              <IconButton
                label={t('logTrade.removeExit', { n: i + 1 })}
                onClick={() => onRemovePartial(p.key)}
                disabled={partials.length === 1}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </IconButton>
            </div>
          ))}

          <div className="flex items-center gap-3 flex-wrap">
            <Button size="sm" variant="ghost" onClick={onAddPartial} className="border border-dashed border-line-control">
              {t('logTrade.addExit')}
            </Button>
            {/* Il trade si registra già chiuso: se i contratti non tornano il
                server rifiuta, tanto vale dirlo mentre si scrive. */}
            <span className={`text-2xs font-mono ${balanced ? 'text-content-muted' : 'text-warn'}`}>
              {t('logTrade.contractsTally', { done: contracts, total: quantity || '—' })}
            </span>
          </div>

          {errors.partials && <p role="alert" className="text-2xs text-neg">{errors.partials}</p>}
        </div>
      )}
    </Card>
  )
}
