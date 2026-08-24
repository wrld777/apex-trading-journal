import { PageHeader } from '../../design-system'
import { t } from '../../i18n'

import MistakesPanel from './sections/MistakesPanel'
import RiskPanel from './sections/RiskPanel'
import SequencePanel from './sections/SequencePanel'
import TiltPanel from './sections/TiltPanel'
import WeeklyReview from './sections/WeeklyReview'

/**
 * Come esegui, non cosa esegui.
 *
 * Analytics e Insights rispondono a "questa strategia funziona?". Questa pagina
 * risponde alla domanda che di solito conta di più: *cosa fai tu con una
 * strategia che funziona*. Quali errori tornano, cosa succede dopo uno stop,
 * quanti trade sono già troppi, se la size è la stessa da un giorno all'altro.
 *
 * L'ordine è quello di una revisione vera: prima la settimana appena chiusa,
 * poi i quattro perché. Chi apre questa pagina il lunedì mattina legge la prima
 * card e ha già fatto metà del lavoro.
 */
export default function Discipline() {
  return (
    <>
      <PageHeader title={t('discipline.title')} subtitle={t('discipline.subtitle')} />

      <WeeklyReview />

      <MistakesPanel />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        <TiltPanel />
        <SequencePanel />
      </div>

      <div className="mt-3.5">
        <RiskPanel />
      </div>
    </>
  )
}
