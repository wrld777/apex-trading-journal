import { Card, CardHeader, Field, Input, SegmentedControl, Select } from '../../../design-system'
import { t } from '../../../i18n'
import type { InstrumentDto } from '../../../types/instrument'
import type { Direction } from '../../../types/trade'
import type { FieldName, FormErrors, FormState } from '../schema'

/**
 * Cosa è stato comprato o venduto, a che prezzo e con quale rischio.
 *
 * Era il primo terzo di un file da 733 righe in cui stato, convalida e sei
 * sezioni di modulo stavano insieme. Ogni sezione ora riceve i suoi campi e i
 * suoi errori, e non sa niente delle altre.
 */
export default function TradeDetails({
  form, errors, onField, direction, onDirection,
  instruments, instrumentsLoading, selectedInstrument, strategyName, restricted,
}: {
  form: FormState
  errors: FormErrors
  onField: (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  direction: Direction
  onDirection: (d: Direction) => void
  instruments: InstrumentDto[]
  instrumentsLoading: boolean
  selectedInstrument: InstrumentDto | null
  strategyName?: string
  /** La strategia scelta limita il catalogo (#95). */
  restricted: boolean
}) {
  // I prezzi si muovono di un tick dello strumento (0,25 sugli indici, 0,01 su CL…).
  const priceStep = selectedInstrument ? String(selectedInstrument.tickSize) : '0.25'
  const err = (f: FieldName) => errors[f]

  return (
    <Card>
      <CardHeader title={t('logTrade.sectionTradeDetails')} />

      <div className="mb-4">
        <span className="text-2xs text-content-muted block mb-1.5">{t('logTrade.direction')}</span>
        <SegmentedControl<Direction>
          value={direction}
          onChange={onDirection}
          label={t('logTrade.direction')}
          size="md"
          className="w-full [&>button]:flex-1"
          tone={v => v === 'Long' ? 'bg-pos/15 text-pos' : 'bg-neg/15 text-neg'}
          options={[
            { value: 'Long', label: t('logTrade.long') },
            { value: 'Short', label: t('logTrade.short') },
          ]}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Field
          label={t('logTrade.instrument')}
          required
          error={err('instrumentId')}
          className="col-span-2"
          /* Il point value è il motivo per cui questo è un catalogo e non testo
             libero: dirlo qui rende esplicita la scala del P&L prima dell'invio. */
          hint={
            selectedInstrument
              ? `${selectedInstrument.currency} ${selectedInstrument.pointValue} per point · tick ${selectedInstrument.tickSize} = ${selectedInstrument.currency} ${selectedInstrument.tickValue}`
              : restricted
                ? t('logTrade.instrumentRestricted', { count: instruments.length, name: strategyName ?? '' })
                : undefined
          }
        >
          <Select value={form.instrumentId} onChange={onField('instrumentId')} disabled={instrumentsLoading}>
            <option value="">{instrumentsLoading ? t('common.loading') : t('logTrade.selectInstrument')}</option>
            {instruments.map(i => (
              <option key={i.instrumentId} value={i.instrumentId}>{i.symbol} · {i.instrumentName}</option>
            ))}
          </Select>
        </Field>

        <Field label={t('logTrade.date')} required error={err('date')}>
          <Input type="date" value={form.date} onChange={onField('date')} />
        </Field>
        <Field label={t('logTrade.time')}>
          <Input type="time" value={form.time} onChange={onField('time')} />
        </Field>
        <Field label={t('logTrade.entryPrice')} required error={err('entryPrice')}>
          <Input type="number" numeric placeholder="0.00" value={form.entryPrice} onChange={onField('entryPrice')} step={priceStep} />
        </Field>
        <Field label={t('logTrade.stopLoss')} required error={err('stopLoss')}>
          <Input type="number" numeric placeholder="0.00" value={form.stopLoss} onChange={onField('stopLoss')} step={priceStep} />
        </Field>
        <Field label={t('logTrade.takeProfit')}>
          <Input type="number" numeric placeholder="0.00" value={form.takeProfit} onChange={onField('takeProfit')} step={priceStep} />
        </Field>
        <Field label={t('logTrade.quantity')} required error={err('quantity')}>
          <Input type="number" numeric placeholder="1" value={form.quantity} onChange={onField('quantity')} min="1" />
        </Field>
      </div>
    </Card>
  )
}
