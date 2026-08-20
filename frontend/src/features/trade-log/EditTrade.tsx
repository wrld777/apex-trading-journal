import { useNavigate, useParams } from 'react-router-dom'

import { Button, Card, PageHeader, Skeleton } from '../../design-system'
import TradeFormFields from '../log-trade/TradeFormFields'
import { useTradeForm } from '../log-trade/useTradeForm'
import { useTrade, useUpdateTrade } from '../../hooks/useTrades'
import { t } from '../../i18n'
import { useToastStore } from '../../store/toastStore'

/**
 * Correggere un trade già registrato.
 *
 * Era un modale che sapeva toccare solo l'uscita e le note: chi sbagliava il
 * lottaggio, il prezzo d'ingresso o lo strumento non aveva altra strada che
 * cancellare il trade e riscriverlo — perdendo screenshot, aderenza e note.
 * Ora è lo stesso modulo della registrazione, riempito col trade: quello che si
 * è potuto scrivere si può correggere.
 */
export default function EditTrade() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: trade, isLoading, isError } = useTrade(id)
  const { mutate: updateTrade, isPending } = useUpdateTrade()
  const addToast = useToastStore(s => s.addToast)
  const f = useTradeForm()

  // Il trade arriva dopo il primo render: `seed` riempie il modulo una volta
  // sola per id, quindi chiamarla qui non calpesta ciò che si sta digitando.
  if (trade) f.seed(trade)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3.5">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    )
  }

  if (isError || !trade) {
    return (
      <Card className="text-center py-10">
        <p className="text-xs text-neg mb-3">{t('tradeDetail.loadFailed')}</p>
        <Button onClick={() => navigate('/trades')}>{t('tradeDetail.backToLog')}</Button>
      </Card>
    )
  }

  const handleSubmit = () => {
    const payload = f.buildPayload()
    if (!payload) {
      addToast(t('logTrade.errFixBelow'), 'error')
      return
    }

    updateTrade(
      { id: trade.id, data: payload },
      {
        onSuccess: () => {
          addToast(t('tradeDetail.updated'), 'success')
          // Si torna al dettaglio, non all'elenco: si è appena corretto *questo*
          // trade ed è quello che si vuole rivedere.
          navigate(`/trades/${trade.id}`)
        },
        onError: (err: unknown) => {
          addToast(err instanceof Error ? err.message : t('tradeDetail.updateFailed'), 'error')
        },
      },
    )
  }

  return (
    <>
      <PageHeader
        title={t('tradeLog.editTitleTrade', { symbol: trade.symbol, direction: trade.direction })}
        subtitle={t('tradeDetail.editSubtitle')}
        actions={
          <>
            <Button onClick={() => navigate(`/trades/${trade.id}`)} disabled={isPending}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" onClick={handleSubmit} loading={isPending}>
              {isPending ? t('common.saving') : t('common.saveChanges')}
            </Button>
          </>
        }
      />

      <TradeFormFields f={f} />
    </>
  )
}
