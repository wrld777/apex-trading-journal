import { fmtDay } from '../../lib/format'

/**
 * Le funzioni di posizionamento condivise fra i grafici.
 *
 * Stanno fuori dai componenti perché sono pura aritmetica — e perché un file
 * che esporta insieme componenti e funzioni rompe il ricaricamento a caldo di
 * Vite, che al salvataggio rimonterebbe l'albero invece di aggiornarlo.
 */

/** Numero di tacche proporzionato all'altezza: sotto i 120px ne bastano tre. */
export function tickCountFor(height: number) {
  return height < 90 ? 2 : height < 160 ? 3 : 4
}

/**
 * Posizione orizzontale dell'i-esimo punto di una serie equispaziata.
 * Con un punto solo si sta al centro: appoggiarlo a sinistra farebbe sembrare
 * la serie troncata.
 */
export function xAt(i: number, n: number, width: number) {
  return n === 1 ? width / 2 : (i / (n - 1)) * width
}

/**
 * Fino a quattro date, agli estremi e ai terzi. Di più, su una card stretta, si
 * sovrappongono; di meno e non si capisce che periodo si sta guardando.
 */
export function dateTicks(dates: string[], x: (i: number) => number, count: 3 | 4 = 4) {
  const n = dates.length
  const idx = n === 1
    ? [0]
    : count === 4
      ? [...new Set([0, Math.round((n - 1) / 3), Math.round((2 * (n - 1)) / 3), n - 1])]
      : [...new Set([0, Math.round((n - 1) / 2), n - 1])]
  return idx.map(i => ({ x: x(i), label: fmtDay(dates[i]) }))
}
