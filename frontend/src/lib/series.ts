import type { DailyPnLDto } from '../types/stats'

/**
 * Le due trasformazioni che stanno sotto i grafici temporali.
 * Erano duplicate fra Dashboard e Analytics, con la stessa firma e due nomi.
 */

export interface CumulativePoint { date: string; value: number; delta: number; trades: number }

/**
 * Da P&L giornaliero a curva cumulata (il backend restituisce i giorni in
 * ordine crescente). `pick` sceglie l'unità: dollari di default, R per le viste
 * che devono restare indipendenti dal capitale.
 *
 * `delta` viaggia insieme al cumulato perché è quello che serve al tooltip:
 * "sei a +4,2R" dice dove sei, "oggi +0,8R" dice perché.
 */
export function cumulative(
  daily: DailyPnLDto[],
  pick: (d: DailyPnLDto) => number = d => d.pnL,
): CumulativePoint[] {
  const out: CumulativePoint[] = []
  for (const d of daily) {
    const prev = out.length ? out[out.length - 1].value : 0
    const delta = pick(d)
    out.push({ date: d.date, value: prev + delta, delta, trades: d.totalTrades })
  }
  return out
}

/** Distanza dal massimo raggiunto, sempre ≥ 0: quanto si è restituito del picco. */
export function drawdownSeries(values: number[]): number[] {
  const dd: number[] = []
  let peak = 0
  for (const v of values) {
    peak = Math.max(peak, v)
    dd.push(peak - v)
  }
  return dd
}
