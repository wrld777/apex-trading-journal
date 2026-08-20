import { Card, CardHeader, Field, Select } from '../../../design-system'
import { t } from '../../../i18n'
import type { FormState } from '../schema'
import TagInput from './TagInput'

/**
 * Il contorno del trade: sessione, setup, bias, giudizio, etichette.
 *
 * ⚠️ I valori delle tendine restano **stringhe fisse** e non passano dal
 * dizionario: vengono salvati così com'è sul trade e i filtri del Trade Log ci
 * fanno match. Tradurli scollegherebbe i trade già registrati dai loro filtri —
 * sono dati, non interfaccia.
 */

const SESSIONS = ['New York Open (09:30)', 'Silver Bullet (10:00)', 'London Open (02:00)', 'London Close (10:00)', 'Asia (20:00)']
const SETUPS = ['Breaker Block', 'ICT Order Block', 'Fair Value Gap', 'Silver Bullet', 'Liquidity Sweep', 'VWAP Rejection']
const BIASES = ['Bullish', 'Bearish', 'Neutral']
const GRADES = ['A+ Setup', 'A Setup', 'B Setup', 'C Setup']

/**
 * Le opzioni più il valore salvato, se non è più in elenco.
 *
 * Serve in modifica: un trade vecchio può avere un setup che nel frattempo è
 * stato tolto da questa lista. Senza, il select mostrerebbe la prima voce
 * mentendo su cosa c'è nel modulo, e al primo salvataggio il valore vero
 * sparirebbe senza che nessuno l'abbia toccato.
 */
const withCurrent = (options: string[], current: string) =>
  current && !options.includes(current) ? [current, ...options] : options

export default function Context({
  form, onField, tags, onTags,
}: {
  form: FormState
  onField: (field: keyof FormState) => (e: React.ChangeEvent<HTMLSelectElement>) => void
  tags: string[]
  onTags: (tags: string[]) => void
}) {
  return (
    <Card>
      <CardHeader title={t('logTrade.sectionContext')} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3.5">
        <Field label={t('logTrade.session')}>
          <Select value={form.session} onChange={onField('session')}>
            {withCurrent(SESSIONS, form.session).map(v => <option key={v}>{v}</option>)}
          </Select>
        </Field>
        <Field label={t('logTrade.setup')}>
          <Select value={form.setup} onChange={onField('setup')}>
            {withCurrent(SETUPS, form.setup).map(v => <option key={v}>{v}</option>)}
          </Select>
        </Field>
        <Field label={t('logTrade.htfBias')}>
          <Select value={form.htfBias} onChange={onField('htfBias')}>
            {withCurrent(BIASES, form.htfBias).map(v => <option key={v}>{v}</option>)}
          </Select>
        </Field>
        <Field label={t('logTrade.grade')}>
          <Select value={form.grade} onChange={onField('grade')}>
            {withCurrent(GRADES, form.grade).map(v => <option key={v}>{v}</option>)}
          </Select>
        </Field>
      </div>
      <TagInput tags={tags} onChange={onTags} />
    </Card>
  )
}
