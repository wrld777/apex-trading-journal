import { cn } from './cn'

/**
 * L'intestazione di una pagina: dove sono, cosa sto guardando, cosa posso fare.
 *
 * Ogni schermata se la ridisegnava, con margini e taglie leggermente diversi.
 * Qui titolo e sottotitolo hanno una gerarchia sola, e le azioni stanno sempre
 * nello stesso posto — così l'occhio impara dove cercarle e non deve rileggere
 * la pagina ogni volta.
 */

interface PageHeaderProps {
  title: string
  /** Una riga che dice cosa contiene la pagina, o su quanti dati è calcolata. */
  subtitle?: React.ReactNode
  /** Comandi della pagina: filtri, esportazioni, "nuovo". */
  actions?: React.ReactNode
  className?: string
}

export default function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-5', className)}>
      <div className="min-w-0">
        <h1 className="font-semibold text-xl tracking-tight text-content-strong leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-content-muted mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0 flex-wrap">{actions}</div>}
    </header>
  )
}
