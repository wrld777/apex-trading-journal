import ScreenshotInput from '../../components/ui/ScreenshotInput'
import { Card, CardHeader } from '../../design-system'
import { useMistakeImpact } from '../../hooks/useAnalytics'
import { t } from '../../i18n'

import Context from './sections/Context'
import ExitPlan from './sections/ExitPlan'
import Notes from './sections/Notes'
import StrategyChecklist from './sections/StrategyChecklist'
import TradeDetails from './sections/TradeDetails'
import type { TradeFormApi } from './useTradeForm'

/**
 * Il disegno del modulo di un trade: le sezioni e come stanno in pagina.
 *
 * Registrazione e modifica mostrano gli stessi campi — la differenza sta solo
 * nel bottone in cima e in cosa succede al salvataggio — quindi il markup vive
 * qui e le due schermate lo montano passando lo stesso `useTradeForm`.
 */
export default function TradeFormFields({ f }: { f: TradeFormApi }) {
  // Le etichette d'errore già usate, per riproporle invece di lasciare che si
  // frammentino in dieci varianti della stessa cosa.
  const { data: mistakes = [] } = useMistakeImpact()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
      {/* La strategia viene per prima, e non è una questione di gusto: decide
          quali strumenti si possono scegliere (#95) e quale checklist compare.
          Scegliendola dopo, uno strumento già selezionato che non le appartiene
          va **cancellato** — c'è una riga in `selectStrategy` che fa esattamente
          questo, ed era la spia che l'ordine era sbagliato. */}
      <div className="flex flex-col gap-3.5">
        <StrategyChecklist
          strategies={f.strategies}
          strategyId={f.strategyId}
          onSelect={f.selectStrategy}
          ruleChecks={f.ruleChecks}
          onToggleRule={f.toggleRule}
        />

        <TradeDetails
          form={f.form}
          errors={f.errors}
          onField={f.onField}
          direction={f.direction}
          onDirection={f.setDirection}
          instruments={f.visibleInstruments}
          instrumentsLoading={f.instrumentsLoading}
          selectedInstrument={f.selectedInstrument}
          strategyName={f.selectedStrategy?.name}
          restricted={f.restricted}
        />

        <ExitPlan
          form={f.form}
          errors={f.errors}
          onField={f.onField}
          outcome={f.outcome}
          onOutcome={f.setOutcome}
          partialsOpen={f.partialsOpen}
          onTogglePartials={f.togglePartials}
          partials={f.partials}
          onPartialChange={f.patchPartial}
          onAddPartial={f.addPartial}
          onRemovePartial={f.removePartial}
        />
      </div>

      {/* A destra il contorno: com'era il mercato, cosa si è visto, cosa si
          pensava. Niente di qui vincola i campi di sinistra. */}
      <div className="flex flex-col gap-3.5">
        <Card>
          <CardHeader title={t('logTrade.sectionScreenshot')} />
          <ScreenshotInput value={f.screenshots} onChange={f.setScreenshots} />
        </Card>

        <Context form={f.form} onField={f.onField} tags={f.tags} onTags={f.setTags} />

        <Notes
          form={f.form}
          onField={f.onField}
          mistakeTags={f.mistakeTags}
          onMistakeTags={f.setMistakeTags}
          knownMistakeTags={mistakes.map(m => m.tag)}
        />
      </div>
    </div>
  )
}
