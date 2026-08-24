import { Card, CardHeader, Field, Select, Textarea } from '../../../design-system'
import { t } from '../../../i18n'
import type { FormState } from '../schema'
import TagInput from './TagInput'

/**
 * Perché il trade è stato preso, in che stato, e cosa è andato storto.
 *
 * Gli errori si scrivono due volte, di proposito. Il testo libero è il racconto
 * — "revenge trade dopo la perdita di ieri" — e serve a te quando rileggi.
 * Le **etichette** sono la stessa cosa in una forma che si può sommare: senza,
 * quella frase resta in un campo che nessuna analisi può leggere, e non saprai
 * mai che è successo sette volte e ti è costato sei R.
 */

const MOODS = ['Calm & Focused', 'Confident', 'Anxious', 'Overconfident', 'Revenge Mode', 'Distracted']

/** Un vocabolario di partenza, per non trovarsi davanti a un campo vuoto la
 *  prima volta. Sono spunti: si sovrascrivono coi propri appena se ne usa uno. */
const COMMON_MISTAKES = [
  'revenge trade',
  'moved my stop',
  'no confirmation',
  'oversized',
  'fomo entry',
  'closed too early',
  'traded the news',
  'no setup',
]

export default function Notes({
  form, onField, mistakeTags, onMistakeTags, knownMistakeTags = [],
}: {
  form: FormState
  onField: (field: keyof FormState) => (e: React.ChangeEvent<HTMLTextAreaElement | HTMLSelectElement>) => void
  mistakeTags: string[]
  onMistakeTags: (tags: string[]) => void
  /** Le etichette già usate in passato: vengono prima di quelle suggerite. */
  knownMistakeTags?: string[]
}) {
  return (
    <Card>
      <CardHeader title={t('logTrade.sectionNotes')} />
      <div className="flex flex-col gap-3">
        <Field label={t('logTrade.rationale')}>
          <Textarea rows={3} placeholder={t('logTrade.rationalePlaceholder')} value={form.rationale} onChange={onField('rationale')} />
        </Field>
        <Field label={t('logTrade.emotionalState')}>
          <Select value={form.emotionalState} onChange={onField('emotionalState')}>
            {MOODS.map(v => <option key={v}>{v}</option>)}
          </Select>
        </Field>
        <Field label={t('logTrade.mistakes')}>
          <Textarea rows={2} placeholder={t('logTrade.mistakesPlaceholder')} value={form.mistakes} onChange={onField('mistakes')} />
        </Field>
        <TagInput
          tags={mistakeTags}
          onChange={onMistakeTags}
          labelKey="logTrade.mistakeTags"
          placeholderKey="logTrade.mistakeTagPlaceholder"
          hint={t('logTrade.mistakeTagsHint')}
          suggestions={[...knownMistakeTags, ...COMMON_MISTAKES.filter(m => !knownMistakeTags.includes(m))]}
          tone={() => 'bg-neg/10 border-neg/20 text-neg'}
        />
      </div>
    </Card>
  )
}
