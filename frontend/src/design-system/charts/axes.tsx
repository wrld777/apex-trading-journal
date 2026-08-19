import type { ScaleLinear } from 'd3-scale'

/**
 * Assi e griglia.
 *
 * Sono i pezzi che mancavano davvero: i grafici avevano tre righe orizzontali
 * a `y=45, 90, 135`, cioè posizioni fisse che non corrispondevano ad alcun
 * valore. Una griglia che non dice a quale numero sta serve solo a fare rumore.
 * Qui le righe nascono dalle tacche della scala, e ogni riga ha la sua etichetta.
 *
 * I colori vengono dai token: `text-faint` sta a 3,86:1, sopra la soglia 3:1
 * prevista per gli elementi non testuali.
 */

const GRID = 'rgb(var(--c-border))'
const AXIS_TEXT = 'rgb(var(--c-text-faint))'

export function GridY({
  scale, width, ticks,
}: { scale: ScaleLinear<number, number>; width: number; ticks: number[] }) {
  return (
    <g aria-hidden="true">
      {ticks.map(v => (
        <line key={v} x1={0} x2={width} y1={scale(v)} y2={scale(v)} stroke={GRID} strokeWidth={1} />
      ))}
    </g>
  )
}

export function AxisY({
  scale, ticks, format,
}: { scale: ScaleLinear<number, number>; ticks: number[]; format: (v: number) => string }) {
  return (
    <g aria-hidden="true">
      {ticks.map(v => (
        <text
          key={v}
          x={-8}
          y={scale(v)}
          dy="0.32em"
          textAnchor="end"
          fill={AXIS_TEXT}
          className="text-2xs"
          fontFamily="var(--font-mono)"
        >
          {format(v)}
        </text>
      ))}
    </g>
  )
}

/**
 * Asse orizzontale. Le tacche arrivano già posizionate perché l'asse delle x è
 * quasi sempre un indice (il giorno n-esimo della serie), non una scala continua.
 * Le etichette agli estremi si ancorano verso l'interno, altrimenti la prima e
 * l'ultima sbordano dalla card.
 */
export function AxisX({
  ticks, y, width,
}: { ticks: { x: number; label: string }[]; y: number; width: number }) {
  return (
    <g aria-hidden="true">
      {ticks.map((tick, i) => (
        <text
          key={`${tick.label}-${i}`}
          x={tick.x}
          y={y + 14}
          textAnchor={tick.x < 12 ? 'start' : tick.x > width - 12 ? 'end' : 'middle'}
          fill={AXIS_TEXT}
          className="text-2xs"
        >
          {tick.label}
        </text>
      ))}
    </g>
  )
}

/**
 * Lo zero non è una tacca come le altre: separa il guadagno dalla perdita, e
 * senza una riga piena il segno di una curva si intuisce solo dal colore.
 */
export function ZeroLine({ y, width }: { y: number; width: number }) {
  return <line x1={0} x2={width} y1={y} y2={y} stroke="rgb(var(--c-border-2))" strokeWidth={1} aria-hidden="true" />
}

/** Traccia verticale che segue il punto in evidenza. */
export function Crosshair({ x, height }: { x: number; height: number }) {
  return (
    <line
      x1={x} x2={x} y1={0} y2={height}
      stroke="rgb(var(--c-control))" strokeWidth={1} strokeDasharray="3 3"
      aria-hidden="true"
    />
  )
}
