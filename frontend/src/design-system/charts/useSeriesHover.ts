import { useCallback, useState } from 'react'

/**
 * Il punto della serie sotto il puntatore — o sotto il cursore da tastiera.
 *
 * Finora l'unico modo di leggere un valore su un grafico era indovinarlo a
 * occhio: nessuno degli otto grafici aveva un tooltip, e i due che ci provavano
 * usavano l'attributo `title`, che compare dopo un secondo abbondante, non si
 * apre col Tab e non si può intonare.
 *
 * L'aggancio non è al punto più vicino in due dimensioni ma alla **colonna**:
 * conta solo la x. È il comportamento giusto per una serie temporale — si cerca
 * un giorno, non un pixel — e non obbliga a inseguire la linea con il mouse.
 *
 * I punti sono equispaziati in tutti i grafici del prodotto, quindi l'indice si
 * ricava dalla frazione di larghezza: nessun bisogno di conoscere le coordinate,
 * che vivono dentro il disegno mentre il gancio vive fuori.
 * `point` misura dal centro di ogni punto, `band` dalla fetta di colonna: è la
 * differenza fra una linea e un istogramma.
 *
 * Le frecce fanno la stessa cosa da tastiera. Non è un di più: senza, il valore
 * esatto resta accessibile solo a chi usa il mouse.
 */
export function useSeriesHover(count: number, mode: 'point' | 'band' = 'point') {
  const [index, setIndex] = useState<number | null>(null)

  const clamp = useCallback((i: number) => Math.min(Math.max(i, 0), count - 1), [count])

  const clear = useCallback(() => setIndex(null), [])

  /** Da appoggiare al rettangolo trasparente che copre l'area di disegno. */
  const areaProps = {
    onPointerMove: (e: React.PointerEvent<SVGRectElement>) => {
      if (count === 0) return
      const rect = e.currentTarget.getBoundingClientRect()
      if (rect.width === 0) return
      const frac = (e.clientX - rect.left) / rect.width
      setIndex(clamp(mode === 'band'
        ? Math.floor(frac * count)
        : Math.round(frac * (count - 1))))
    },
    onPointerLeave: clear,
  }

  /** Da appoggiare all'SVG: rende il grafico raggiungibile col Tab. */
  const svgProps: React.SVGProps<SVGSVGElement> = {
    tabIndex: count > 0 ? 0 : -1,
    onFocus: () => setIndex(i => (i === null ? count - 1 : i)),
    onBlur: clear,
    onKeyDown: (e: React.KeyboardEvent<SVGSVGElement>) => {
      if (count === 0) return
      const cur = index ?? count - 1
      if (e.key === 'ArrowRight') { e.preventDefault(); setIndex(clamp(cur + 1)) }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); setIndex(clamp(cur - 1)) }
      else if (e.key === 'Home') { e.preventDefault(); setIndex(0) }
      else if (e.key === 'End') { e.preventDefault(); setIndex(count - 1) }
      else if (e.key === 'Escape') { clear() }
    },
  }

  return { index, clear, areaProps, svgProps }
}
