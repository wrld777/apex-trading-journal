import { useMeasuredWidth } from './useMeasuredWidth'

/**
 * La cornice di ogni grafico.
 *
 * Prima ogni grafico si disegnava in un `viewBox` fisso (400×180, 800×180) e
 * lasciava che il browser lo stirasse fino alla larghezza della card. Con
 * `preserveAspectRatio="none"` — usato sulla curva della Dashboard — lo stiramento
 * non è uniforme: la stessa linea da 2px risultava spessa 2px in verticale e
 * mezzo pixel in orizzontale, e un'eventuale etichetta sarebbe uscita schiacciata.
 * Con `xMidYMid meet` il problema è opposto: il grafico non riempie mai il
 * riquadro e i 9px dichiarati per un testo diventano 5 o 14 a seconda della card.
 *
 * Qui la larghezza si **misura** e l'SVG viene disegnato in pixel reali: una
 * unità SVG è un pixel CSS, quindi spessori, raggi e testi valgono quanto
 * dichiarato, ovunque il grafico venga montato.
 *
 * I margini sono lo spazio riservato agli assi. Il contenuto vive dentro un
 * gruppo già traslato, così ogni grafico ragiona in coordinate `0..inner`.
 */

export interface Margin { top: number; right: number; bottom: number; left: number }

export interface ChartBox {
  /** Larghezza totale dell'SVG, in pixel. */
  width: number
  height: number
  /** Area di disegno, al netto dei margini: l'origine del gruppo traslato. */
  inner: { width: number; height: number }
  m: Margin
}

const DEFAULT_MARGIN: Margin = { top: 10, right: 12, bottom: 22, left: 44 }

interface ChartFrameProps {
  height: number
  margin?: Partial<Margin>
  /**
   * Cosa mostra il grafico, in una frase. Non è decorativo: è l'unica versione
   * del grafico che arriva a chi usa uno screen reader.
   */
  label: string
  /** Contenuto SVG, in coordinate relative all'area di disegno. */
  children: (box: ChartBox) => React.ReactNode
  /** Livello HTML sopra l'SVG, in coordinate del contenitore: i tooltip. */
  overlay?: (box: ChartBox) => React.ReactNode
  /** Proprietà da appoggiare all'SVG: focus e tastiera arrivano da `useSeriesHover`. */
  svgProps?: React.SVGProps<SVGSVGElement>
  className?: string
}

export default function ChartFrame({
  height, margin, label, children, overlay, svgProps, className,
}: ChartFrameProps) {
  const [ref, width] = useMeasuredWidth<HTMLDivElement>()
  const m = { ...DEFAULT_MARGIN, ...margin }

  const box: ChartBox = {
    width,
    height,
    inner: {
      width: Math.max(width - m.left - m.right, 0),
      height: Math.max(height - m.top - m.bottom, 0),
    },
    m,
  }

  const ready = box.inner.width > 0 && box.inner.height > 0

  return (
    <div ref={ref} className={`relative w-full ${className ?? ''}`} style={{ height }}>
      {ready && (
        <>
          <svg
            width={width}
            height={height}
            role="img"
            aria-label={label}
            className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 rounded"
            {...svgProps}
          >
            <g transform={`translate(${m.left},${m.top})`}>{children(box)}</g>
          </svg>
          {overlay?.(box)}
        </>
      )}
    </div>
  )
}
