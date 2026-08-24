import { useState } from 'react'

import { useInstruments } from '../../hooks/useInstruments'
import { useStrategies } from '../../hooks/useStrategies'
import type { InstrumentDto } from '../../types/instrument'
import type { StrategyDto } from '../../types/strategy'
import type { CreateTradeRequest, Direction, TradeDto, TradeOutcome } from '../../types/trade'

import { DEFAULT_FORM, newPartial, validate, type FormErrors, type FormState, type PartialDraft } from './schema'

/**
 * Lo stato del modulo di un trade, uguale in registrazione e in modifica.
 *
 * Stava tutto dentro `LogTrade`, e la modifica aveva un modale separato che
 * sapeva toccare solo l'uscita e le note: sbagliare il lottaggio o il prezzo
 * d'ingresso significava cancellare il trade e riscriverlo. Le due schermate ora
 * compilano lo stesso modulo e producono lo stesso corpo — una PUT rimpiazza il
 * trade per intero, quindi la forma del payload è la stessa della POST.
 *
 * `seed` accetta il trade quando arriva dal server (una query è asincrona: al
 * primo render non c'è ancora) e riempie il modulo una volta sola per id.
 */

/** Da un ISO UTC ai due campi separati che il modulo mostra. */
function splitIso(iso: string | null): { date: string; time: string } {
  if (!iso) return { date: '', time: '' }
  return { date: iso.slice(0, 10), time: iso.slice(11, 16) }
}

/** …e ritorno. Il server tratta l'orario come UTC, come già faceva l'entry. */
function joinIso(date: string, time: string): string | null {
  if (!date) return null
  return `${date}T${time || '00:00'}:00.000Z`
}

export interface TradeFormApi {
  form: FormState
  errors: FormErrors
  direction: Direction
  tags: string[]
  mistakeTags: string[]
  screenshots: string[]
  strategyId: string
  ruleChecks: Record<string, boolean>
  outcome: TradeOutcome | ''
  partialsOpen: boolean
  partials: PartialDraft[]

  instruments: InstrumentDto[]
  instrumentsLoading: boolean
  strategies: StrategyDto[]
  selectedInstrument: InstrumentDto | null
  selectedStrategy: StrategyDto | null
  visibleInstruments: InstrumentDto[]
  restricted: boolean

  onField: (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => void
  setDirection: (d: Direction) => void
  setTags: (tags: string[]) => void
  setMistakeTags: (tags: string[]) => void
  setScreenshots: (urls: string[]) => void
  selectStrategy: (id: string) => void
  toggleRule: (id: string) => void
  setOutcome: (o: TradeOutcome) => void
  togglePartials: () => void
  patchPartial: (key: string, patch: Partial<PartialDraft>) => void
  addPartial: () => void
  removePartial: (key: string) => void

  reset: () => void
  seed: (trade: TradeDto) => void
  /** Convalida e restituisce il corpo da inviare, o `null` se ci sono errori. */
  buildPayload: () => CreateTradeRequest | null
}

export function useTradeForm(): TradeFormApi {
  const { data: strategies = [] } = useStrategies()
  const { data: instruments = [], isLoading: instrumentsLoading } = useInstruments()

  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [direction, setDirection] = useState<Direction>('Long')
  const [tags, setTags] = useState<string[]>([])
  const [mistakeTags, setMistakeTags] = useState<string[]>([])
  const [screenshots, setScreenshots] = useState<string[]>([])
  const [strategyId, setStrategyId] = useState('')
  // Aderenza per regola: quali condizioni oggettive erano rispettate su questo trade.
  const [ruleChecks, setRuleChecks] = useState<Record<string, boolean>>({})
  // Uscita (#96): esito singolo, oppure righe parziali quando la sezione è aperta.
  const [outcome, setOutcome] = useState<TradeOutcome | ''>('')
  const [partialsOpen, setPartialsOpen] = useState(false)
  const [partials, setPartials] = useState<PartialDraft[]>([newPartial()])
  const [errors, setErrors] = useState<FormErrors>({})
  const [seededId, setSeededId] = useState<string | null>(null)

  const selectedInstrument = instruments.find(i => i.instrumentId === form.instrumentId) ?? null
  const selectedStrategy = strategies.find(s => s.id === strategyId) ?? null

  // Una strategia dichiara su quali strumenti gira (#95): se ne ha, il select
  // mostra solo quelli. Elenco vuoto = nessun vincolo, si vede tutto il catalogo.
  const allowedInstrumentIds = selectedStrategy?.instrumentIds ?? []
  const visibleInstruments = allowedInstrumentIds.length > 0
    ? instruments.filter(i => allowedInstrumentIds.includes(i.instrumentId))
    : instruments

  /** Correggere un campo ne toglie l'errore: tenerlo acceso mentre si scrive la
   *  risposta giusta è la cosa più fastidiosa che un modulo possa fare. */
  const onField = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
    setErrors(prev => (prev[field] ? { ...prev, [field]: undefined } : prev))
  }

  const selectStrategy = (id: string) => {
    setStrategyId(id)
    const s = strategies.find(x => x.id === id)
    setRuleChecks(s ? Object.fromEntries(s.rules.map(r => [r.id, false])) : {})

    // Lo strumento già scelto può non rientrare fra quelli della nuova strategia:
    // lasciarlo selezionato ma fuori lista significherebbe un select che mostra
    // il segnaposto e invia comunque il vecchio id.
    const allowed = s?.instrumentIds ?? []
    if (allowed.length > 0 && form.instrumentId && !allowed.includes(form.instrumentId)) {
      setForm(prev => ({ ...prev, instrumentId: '' }))
    }
  }

  const togglePartials = () => {
    // Rientrando su uscita singola le righe non servono più; entrando, si parte
    // da una riga sola così il primo parziale è già pronto da compilare.
    setPartials([newPartial()])
    setPartialsOpen(open => !open)
    setErrors(prev => ({ ...prev, outcome: undefined, partials: undefined }))
  }

  const reset = () => {
    setForm(DEFAULT_FORM)
    setDirection('Long')
    setTags([])
    setMistakeTags([])
    setScreenshots([])
    setStrategyId('')
    setRuleChecks({})
    setOutcome('')
    setPartialsOpen(false)
    setPartials([newPartial()])
    setErrors({})
  }

  /**
   * Riempie il modulo con un trade esistente. Una sola volta per id: chiamarla a
   * ogni render sovrascriverebbe quello che si sta digitando.
   */
  const seed = (trade: TradeDto) => {
    if (trade.id === seededId) return
    setSeededId(trade.id)

    const entry = splitIso(trade.entryTime)
    const exit = splitIso(trade.exitTime)
    const exits = trade.exits ?? []
    // Più di un'uscita significa parziali; con una sola l'esito basta, e il
    // prezzo lo si mostra solo se era manuale (per gli altri lo deriva il server
    // dai livelli, e riscriverlo a mano non avrebbe effetto).
    const scaled = exits.length > 1
    const single = exits[0]

    setForm({
      instrumentId: trade.instrumentId,
      date: entry.date,
      time: entry.time,
      exitDate: exit.date,
      exitTime: exit.time,
      entryPrice: String(trade.entryPrice),
      stopLoss: String(trade.stopLoss),
      takeProfit: trade.takeProfit ? String(trade.takeProfit) : '',
      exitPrice: single && single.outcome === 'Manual' ? String(single.price) : '',
      quantity: String(trade.quantity),
      session: trade.session,
      setup: trade.setup,
      htfBias: trade.htfBias,
      grade: trade.grade,
      rationale: trade.rationale ?? '',
      emotionalState: trade.emotionalState || DEFAULT_FORM.emotionalState,
      mistakes: trade.mistakes ?? '',
    })
    setDirection(trade.direction)
    setTags(trade.tags ?? [])
    setMistakeTags(trade.mistakeTags ?? [])
    setScreenshots(trade.screenshots ?? [])
    setStrategyId(trade.strategyId ?? '')
    setRuleChecks(Object.fromEntries((trade.ruleChecks ?? []).map(c => [c.strategyRuleId, c.checked])))
    setPartialsOpen(scaled)
    setOutcome(scaled ? '' : (single?.outcome ?? ''))
    setPartials(
      scaled
        ? exits.map(e => ({
            ...newPartial(),
            outcome: e.outcome,
            contracts: String(e.contracts),
            price: e.outcome === 'Manual' ? String(e.price) : '',
          }))
        : [newPartial()],
    )
    setErrors({})
  }

  const buildPayload = (): CreateTradeRequest | null => {
    const found = validate(form, { partialsOpen, outcome, partials, exitPrice: form.exitPrice })
    setErrors(found)
    if (Object.keys(found).length > 0) return null

    return {
      instrumentId: form.instrumentId,
      direction,
      entryPrice: parseFloat(form.entryPrice),
      stopLoss: parseFloat(form.stopLoss),
      takeProfit: form.takeProfit ? parseFloat(form.takeProfit) : 0,
      exitPrice: form.exitPrice ? parseFloat(form.exitPrice) : 0,
      quantity: parseInt(form.quantity, 10),
      entryTime: joinIso(form.date, form.time)!,
      // Senza uscita non c'è durata: è il motivo per cui `avgHoldMinutes` è
      // rimasto a zero finché il campo non esisteva nel modulo (#53).
      exitTime: joinIso(form.exitDate, form.exitTime),
      session: form.session,
      setup: form.setup,
      htfBias: form.htfBias,
      grade: form.grade,
      rationale: form.rationale,
      emotionalState: form.emotionalState,
      mistakes: form.mistakes,
      mistakeTags,
      tags,
      screenshots,
      strategyId: strategyId || null,
      ruleChecks: selectedStrategy
        ? selectedStrategy.rules.map(r => ({ strategyRuleId: r.id, checked: !!ruleChecks[r.id] }))
        : [],
      // Esito singolo oppure parziali: `exits` vince quando c'è, quindi si manda
      // solo la forma effettivamente usata.
      ...(partialsOpen
        ? {
            exits: partials.map((p, i) => ({
              outcome: p.outcome,
              contracts: parseInt(p.contracts, 10),
              price: p.outcome === 'Manual' ? parseFloat(p.price) : undefined,
              order: i,
            })),
          }
        : { outcome: outcome as TradeOutcome }),
    }
  }

  return {
    form, errors, direction, tags, mistakeTags, screenshots, strategyId, ruleChecks, outcome, partialsOpen, partials,
    instruments, instrumentsLoading, strategies, selectedInstrument, selectedStrategy, visibleInstruments,
    restricted: allowedInstrumentIds.length > 0,
    onField,
    setDirection,
    setTags,
    setMistakeTags,
    setScreenshots,
    selectStrategy,
    toggleRule: id => setRuleChecks(prev => ({ ...prev, [id]: !prev[id] })),
    setOutcome: o => { setOutcome(o); setErrors(prev => ({ ...prev, outcome: undefined })) },
    togglePartials,
    patchPartial: (key, patch) => {
      setPartials(ps => ps.map(p => (p.key === key ? { ...p, ...patch } : p)))
      setErrors(prev => (prev.partials ? { ...prev, partials: undefined } : prev))
    },
    addPartial: () => setPartials(ps => [...ps, newPartial()]),
    removePartial: key => setPartials(ps => ps.filter(p => p.key !== key)),
    reset,
    seed,
    buildPayload,
  }
}
