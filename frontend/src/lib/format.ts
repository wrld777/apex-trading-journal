/**
 * Come si scrivono i numeri, in un posto solo.
 *
 * Le stesse quattro funzioni erano ricopiate in Dashboard, Analytics e
 * Insights, e già divergevano: la "R" negativa usava il segno meno tipografico
 * (−) in un file e il trattino (-) in un altro, sulla stessa schermata.
 */

/** Separatore delle migliaia e decimali fissi: le cifre restano incolonnate. */
export function fmt(n: number, decimals = 0) {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

/** Dollari col segno sempre esplicito: `+$1,240` / `-$310`. */
export function fmtPnl(n: number) {
  return n >= 0 ? `+$${fmt(n)}` : `-$${fmt(Math.abs(n))}`
}

/**
 * Risultato in unità di rischio: il metro che non dipende dalla size né dal
 * capitale dichiarato, e l'unico con cui si confrontano due strategie.
 */
export function fmtR(n: number) {
  return `${n >= 0 ? '+' : '−'}${fmt(Math.abs(n), 2)}R`
}

export function fmtPct(n: number, decimals = 0) {
  return `${fmt(n, decimals)}%`
}

/**
 * Dollari abbreviati, per le tacche di un asse e le celle strette: lì lo spazio
 * è di quattro o cinque caratteri e `+$12,400` non ci sta.
 * Sotto i mille resta il numero pieno — `$0.1k` al posto di `$89` non abbrevia,
 * cancella l'informazione.
 */
export function fmtUsdShort(n: number) {
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1000) {
    const k = abs / 1000
    return `${sign}$${k >= 10 ? Math.round(k) : k.toFixed(1)}k`
  }
  return `${sign}$${Math.round(abs)}`
}

/** Il colore segue il segno; lo zero non è né un guadagno né una perdita. */
export function pnlColor(n: number) {
  return n > 0 ? 'text-pos' : n < 0 ? 'text-neg' : 'text-content-secondary'
}

const DAY_MONTH: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }

/** `12 Mar` — la data corta usata su tutti gli assi e i tooltip. */
export function fmtDay(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', DAY_MONTH)
}
