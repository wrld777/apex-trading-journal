import { Button, PageHeader } from '../../design-system'
import { useCreateTrade } from '../../hooks/useTrades'
import { t } from '../../i18n'
import { useToastStore } from '../../store/toastStore'

import TradeFormFields from './TradeFormFields'
import { useTradeForm } from './useTradeForm'

/**
 * Registrazione di un trade.
 *
 * Qui resta solo cosa succede al salvataggio: lo stato e la convalida stanno in
 * `useTradeForm`, il disegno delle sezioni in `TradeFormFields`. Sono gli stessi
 * che usa la schermata di modifica — un trade si corregge con lo stesso modulo
 * con cui lo si scrive.
 *
 * Gli errori si mostrano **sotto il campo che li causa**. Finivano tutti in un
 * toast: un messaggio in un angolo, che sparisce da solo e non dice quale dei
 * dodici campi manca. Il toast resta per il risultato della chiamata, che è
 * l'unica cosa che non appartiene a nessun campo.
 */
export default function LogTrade() {
  const { mutate: createTrade, isPending } = useCreateTrade()
  const addToast = useToastStore(s => s.addToast)
  const f = useTradeForm()

  const handleSubmit = () => {
    const payload = f.buildPayload()
    if (!payload) {
      // Il riepilogo dice solo che c'è qualcosa da correggere: il *cosa* sta
      // accanto al campo, dove serve, e non sparisce da solo dopo tre secondi.
      addToast(t('logTrade.errFixBelow'), 'error')
      return
    }

    createTrade(payload, {
      onSuccess: () => {
        addToast(t('logTrade.saved'), 'success')
        f.reset()
      },
      onError: (err: unknown) => {
        addToast(err instanceof Error ? err.message : t('logTrade.saveFailed'), 'error')
      },
    })
  }

  return (
    <>
      <PageHeader
        title={t('logTrade.title')}
        subtitle={t('logTrade.subtitle')}
        actions={
          <>
            <Button onClick={f.reset} disabled={isPending}>{t('logTrade.reset')}</Button>
            <Button variant="primary" onClick={handleSubmit} loading={isPending}>
              {isPending ? t('logTrade.submitting') : t('logTrade.submit')}
            </Button>
          </>
        }
      />

      <TradeFormFields f={f} />
    </>
  )
}
