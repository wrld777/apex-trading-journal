import { z } from 'zod'

import { t } from '../../i18n'
import type { TradeOutcome } from '../../types/trade'

/**
 * Le regole del modulo, dichiarate una volta sola.
 *
 * Prima la convalida era una catena di `if` dentro `handleSubmit`, e ogni
 * fallimento finiva in un **toast**: un messaggio che compare in un angolo,
 * sparisce da solo e non dice *quale* dei dodici campi manca. "Please fill in
 * all required fields" su un modulo lungo due schermate è una caccia al tesoro.
 *
 * Qui ogni errore nasce già legato al suo campo, e il campo lo mostra sotto di
 * sé. Il toast resta solo per ciò che il toast sa fare: dire com'è andata la
 * chiamata al server.
 *
 * Sono state valutate anche `react-hook-form` più `zod`: il modulo però tiene
 * stati che un gestore di form non modella comodamente (le uscite parziali,
 * l'aderenza per regola, gli id degli strumenti filtrati dalla strategia), e
 * il guadagno sarebbe stato solo qualche render in meno. Lo schema serviva,
 * il gestore no.
 */

/** I campi arrivano dagli input: sempre stringhe, anche i numeri. */
export const DEFAULT_FORM = {
  instrumentId: '',
  date: '',
  time: '',
  // Quando si è usciti. Facoltativo, ma finché il campo non c'è la durata di un
  // trade non è calcolabile e `avgHoldMinutes` resta a zero (#53).
  exitDate: '',
  exitTime: '',
  entryPrice: '',
  stopLoss: '',
  takeProfit: '',
  exitPrice: '',
  quantity: '',
  session: 'New York Open (09:30)',
  setup: 'Breaker Block',
  htfBias: 'Bullish',
  grade: 'A+ Setup',
  rationale: '',
  emotionalState: 'Calm & Focused',
  mistakes: '',
}

export type FormState = typeof DEFAULT_FORM
export type FieldName = keyof FormState | 'outcome' | 'partials'
/** Un messaggio per campo: è ciò che `Field` sa mostrare. */
export type FormErrors = Partial<Record<FieldName, string>>

export interface PartialDraft {
  key: string
  outcome: TradeOutcome
  contracts: string
  price: string
}

let partialKeySeq = 1
export const newPartial = (): PartialDraft => ({
  key: `x${partialKeySeq++}`,
  outcome: 'TakeProfit',
  contracts: '',
  price: '',
})

/** Numero positivo scritto in un input di testo. */
const positiveNumber = (message: string) =>
  z.string().trim().refine(v => v !== '' && Number.isFinite(Number(v)) && Number(v) > 0, message)

const baseSchema = z.object({
  instrumentId: z.string().min(1, t('logTrade.errInstrument')),
  date: z.string().min(1, t('logTrade.errDate')),
  entryPrice: positiveNumber(t('logTrade.errEntryPrice')),
  stopLoss: positiveNumber(t('logTrade.errStopLoss')),
  quantity: z.string().trim().refine(
    v => Number.isInteger(Number(v)) && Number(v) > 0,
    t('logTrade.errQuantity'),
  ),
})

export interface ExitState {
  partialsOpen: boolean
  outcome: TradeOutcome | ''
  partials: PartialDraft[]
  exitPrice: string
}

/**
 * Convalida l'intero modulo e restituisce gli errori per campo.
 * Un oggetto vuoto significa "si può inviare".
 */
export function validate(form: FormState, exit: ExitState): FormErrors {
  const errors: FormErrors = {}

  const parsed = baseSchema.safeParse(form)
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as FieldName | undefined
      if (field && !errors[field]) errors[field] = issue.message
    }
  }

  // Lo stop coincidente con l'entry non è un errore di battitura: è un trade
  // senza rischio definito, e senza rischio non esiste un R-multiplo.
  if (!errors.stopLoss && form.entryPrice && form.stopLoss && Number(form.entryPrice) === Number(form.stopLoss)) {
    errors.stopLoss = t('logTrade.errStopEqualsEntry')
  }

  // Un'uscita che precede l'ingresso è una data sbagliata, non un trade strano.
  if (form.exitDate && form.date && `${form.exitDate}T${form.exitTime || '00:00'}` < `${form.date}T${form.time || '00:00'}`) {
    errors.exitDate = t('logTrade.errExitBeforeEntry')
  }

  // Uscita (#96): il trade si registra sempre già chiuso, quindi l'esito è
  // obbligatorio e sui parziali i contratti devono coprire tutta la quantità.
  if (!exit.partialsOpen) {
    if (exit.outcome === '') {
      errors.outcome = t('logTrade.chooseOutcome')
    } else if (exit.outcome === 'Manual' && !exit.exitPrice) {
      errors.exitPrice = t('logTrade.manualNeedsPrice')
    }
  } else {
    const quantity = parseInt(form.quantity, 10) || 0
    const contracts = exit.partials.reduce((sum, p) => sum + (parseInt(p.contracts, 10) || 0), 0)
    if (exit.partials.some(p => (parseInt(p.contracts, 10) || 0) <= 0)) {
      errors.partials = t('logTrade.everyExitNeedsContracts')
    } else if (exit.partials.some(p => p.outcome === 'Manual' && !p.price)) {
      errors.partials = t('logTrade.manualNeedsPricePlural')
    } else if (contracts !== quantity) {
      errors.partials = t('logTrade.exitsMismatch', { done: contracts, total: quantity })
    }
  }

  return errors
}
