import { isRouteErrorResponse, useRouteError } from 'react-router-dom'

import { Button, Logo } from '../design-system'
import { t } from '../i18n'

/**
 * Quando la rotta non esiste, o qualcosa è esploso più in alto di ogni pagina.
 *
 * Era una riga di testo centrata su fondo nero: tecnicamente un 404, ma senza un
 * modo per tornare indietro — l'unica uscita era il tasto Indietro del browser o
 * riscrivere l'indirizzo a mano. Un vicolo cieco è la cosa peggiore da mostrare
 * a chi ha già sbagliato strada.
 */
export default function RootError() {
  const error = useRouteError()
  // Senza errore siamo arrivati dalla rotta jolly: è un indirizzo che non
  // esiste, non un guasto.
  const notFound = !error || (isRouteErrorResponse(error) && error.status === 404)

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 text-center">
      <Logo className="h-8 w-8 mb-6" />

      <p className="font-mono text-2xs text-content-faint tracking-[0.2em] mb-3">
        {notFound ? '404' : t('error.code')}
      </p>

      <h1 className="text-xl font-semibold text-content-strong tracking-tight mb-2">
        {notFound ? t('error.notFoundTitle') : t('error.unexpectedTitle')}
      </h1>

      <p className="text-xs text-content-muted max-w-sm leading-relaxed mb-6">
        {notFound ? t('error.notFound') : t('error.unexpected')}
      </p>

      <div className="flex items-center gap-2">
        {/* Un ricaricamento vero, non una navigazione dentro la stessa app:
            se si è finiti qui per uno stato rotto, ripartire pulito è il punto. */}
        <Button variant="primary" onClick={() => { window.location.href = '/' }}>
          {t('error.backHome')}
        </Button>
        <Button onClick={() => window.location.reload()}>{t('error.reload')}</Button>
      </div>
    </div>
  )
}
