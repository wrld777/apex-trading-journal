import { useEffect, useRef } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { t } from '../i18n'
import { cn } from './cn'

/**
 * Dialogo modale, costruito su Radix.
 *
 * La versione scritta a mano gestiva Escape e il blocco dello scroll, ma non
 * intrappolava il focus e non lo restituiva alla chiusura: col Tab si usciva
 * dal dialogo e si finiva a navigare la pagina sottostante, invisibile dietro
 * l'overlay. Sono i due comportamenti che a mano si sbagliano sempre, ed è la
 * ragione per cui questa primitiva vale una dipendenza.
 *
 * L'interfaccia è rimasta la stessa di prima, quindi i punti che la usano non
 * cambiano.
 */

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  /** Azioni in fondo al dialogo, allineate a destra. */
  footer?: React.ReactNode
  /** Classe Tailwind di larghezza massima. Default `max-w-lg`. */
  maxWidth?: string
}

export default function Modal({ open, onClose, title, children, footer, maxWidth = 'max-w-lg' }: ModalProps) {
  /**
   * Chi aveva il focus prima dell'apertura.
   *
   * Il dialogo non ha un `Dialog.Trigger` — è pilotato dallo stato di chi lo
   * usa — e in quel caso il ritorno automatico del focus non ha un bersaglio
   * affidabile: alla chiusura il focus finiva sul `<body>`, cioè chi naviga da
   * tastiera ripartiva dall'inizio della pagina invece che dal bottone che
   * aveva premuto. Qui l'elemento se lo ricorda il dialogo.
   */
  const opener = useRef<HTMLElement | null>(null)
  useEffect(() => {
    if (open) opener.current = document.activeElement as HTMLElement | null
  }, [open])

  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-modal bg-black/70 backdrop-blur-sm" />
        <Dialog.Content
          onCloseAutoFocus={(event) => {
            const target = opener.current
            if (target && target.isConnected) {
              event.preventDefault()
              target.focus()
            }
          }}
          className={cn(
            'fixed left-1/2 top-1/2 z-modal w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2',
            'bg-surface border border-line-2 rounded-lg shadow-2xl',
            'max-h-[90vh] flex flex-col focus:outline-none',
            maxWidth,
          )}
        >
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-line">
            <Dialog.Title className="font-semibold text-md text-content-strong tracking-tight">
              {title}
            </Dialog.Title>
            <Dialog.Close
              className="text-content-muted hover:text-content-strong transition-colors rounded-sm"
              aria-label={t('common.close')}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Dialog.Close>
          </div>

          <div className="px-5 py-4 overflow-y-auto">{children}</div>

          {footer && (
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-line">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
