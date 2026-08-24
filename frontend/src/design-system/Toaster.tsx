import { Check, Info, X } from 'lucide-react'
import { useToastStore, type ToastType } from '../store/toastStore'
import { t } from '../i18n'
import { cn } from './cn'

/**
 * Notifiche di sistema.
 *
 * Tre difetti della versione precedente, tutti sulla stessa riga di codice:
 * il messaggio stava in un `<div>` cliccabile — quindi non raggiungibile col
 * Tab e senza modo di chiuderlo da tastiera; l'unico `role="status"` era sul
 * singolo toast, che compare *dopo* che lo screen reader ha già letto la
 * pagina, quindi l'annuncio poteva perdersi; e non c'era distinzione fra un
 * avviso e un errore, che vanno annunciati con urgenza diversa.
 *
 * Ora la regione `aria-live` è fissa e sempre montata: gli screen reader la
 * osservano e leggono ciò che vi compare dentro. Gli errori usano `assertive`,
 * il resto `polite`.
 */

const TONES: Record<ToastType, string> = {
  success: 'bg-pos/10 border-pos/25 text-pos',
  error:   'bg-neg/10 border-neg/25 text-neg',
  info:    'bg-surface-3 border-line-control text-content',
}

const ICONS: Record<ToastType, typeof Check> = {
  success: Check,
  error: X,
  info: Info,
}

export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  const removeToast = useToastStore((s) => s.removeToast)

  return (
    <div
      className="fixed bottom-5 right-5 z-toast flex flex-col gap-2 pointer-events-none"
      role="region"
      aria-label={t('toast.region')}
    >
      {(['polite', 'assertive'] as const).map((politeness) => (
        <div key={politeness} aria-live={politeness} className="flex flex-col gap-2">
          {toasts
            .filter((toast) => (politeness === 'assertive' ? toast.type === 'error' : toast.type !== 'error'))
            .map((toast) => {
              const Icon = ICONS[toast.type]
              return (
                <div
                  key={toast.id}
                  className={cn(
                    'pointer-events-auto flex items-start gap-2.5 rounded-lg border py-3 pl-4 pr-3',
                    'text-sm font-medium shadow-lg max-w-sm',
                    TONES[toast.type],
                  )}
                >
                  <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0" aria-hidden="true" />
                  <span className="flex-1">{toast.message}</span>
                  <button
                    type="button"
                    onClick={() => removeToast(toast.id)}
                    aria-label={t('toast.dismiss')}
                    className="shrink-0 rounded-sm opacity-60 hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              )
            })}
        </div>
      ))}
    </div>
  )
}
