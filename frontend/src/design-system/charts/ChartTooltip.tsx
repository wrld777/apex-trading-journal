import type { ChartBox } from './ChartFrame'

/**
 * Il riquadro di lettura di un grafico cartesiano.
 *
 * È HTML sopra l'SVG, non un `<text>` dentro: dentro l'SVG andrebbe misurato a
 * mano per non sbordare, e il testo non andrebbe a capo. Le coordinate arrivano
 * in unità dell'area di disegno; qui vengono riportate al contenitore e
 * trattenute ai bordi, così vicino al margine il riquadro scorre invece di
 * uscire dalla card.
 *
 * `pointer-events-none` è obbligatorio: un riquadro che intercetta il puntatore
 * si mette fra il mouse e il grafico, e l'aggancio comincia a tremolare.
 */
export default function ChartTooltip({
  box, x, y, children,
}: { box: ChartBox; x: number; y: number; children: React.ReactNode }) {
  const HALF = 70   // metà della larghezza tipica: quanto basta per non sbordare
  const left = Math.min(Math.max(box.m.left + x, HALF + 4), box.width - HALF - 4)

  return (
    <div
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded border border-line-2 bg-surface-3 px-2 py-1 text-2xs text-content shadow-lg whitespace-nowrap"
      style={{ left, top: box.m.top + y - 10 }}
      role="presentation"
    >
      {children}
    </div>
  )
}

/**
 * La stessa informazione, in prosa, per chi non vede il grafico.
 * Vive fuori dal riquadro visivo e viene letta a ogni spostamento del cursore.
 */
export function ChartAnnouncement({ text }: { text: string | null }) {
  return <p className="sr-only" aria-live="polite">{text ?? ''}</p>
}
