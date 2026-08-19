import { Card, CardHeader, Field, Select, Textarea } from '../../../design-system'
import { t } from '../../../i18n'
import type { FormState } from '../schema'

/** Perché il trade è stato preso, in che stato, e cosa è andato storto. */

const MOODS = ['Calm & Focused', 'Confident', 'Anxious', 'Overconfident', 'Revenge Mode', 'Distracted']

export default function Notes({
  form, onField,
}: {
  form: FormState
  onField: (field: keyof FormState) => (e: React.ChangeEvent<HTMLTextAreaElement | HTMLSelectElement>) => void
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
      </div>
    </Card>
  )
}
