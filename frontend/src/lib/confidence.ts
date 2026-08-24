import { fmt } from './format'
import { t } from '../i18n'

/**
 * Quanto fidarsi di un'expectancy.
 *
 * Con diciannove trade "+0,85R" non è +0,85R: è un intervallo largo, e leggerlo
 * come una certezza è il modo più comune di buttare una strategia che
 * funzionava — o di raddoppiare la size su una che non funziona. Il server
 * calcola l'errore standard della media; qui si decide solo come dirlo.
 *
 * La soglia è sull'intervallo, non sul numero di trade: cento trade tutti
 * uguali dicono più di trecento sparpagliati, e contare i trade ignorerebbe
 * proprio la dispersione che rende incerto il risultato.
 */

/** `±0.42R`, o stringa vuota se il campione non permette di calcolarlo. */
export function fmtMargin(stdErr: number): string {
  if (!stdErr) return ''
  // Due errori standard: l'intervallo che di solito si intende dicendo
  // "attorno a". Uno solo suonerebbe più preciso di quanto sia.
  return `±${fmt(stdErr * 2, 2)}R`
}

/**
 * Vero quando l'incertezza è così larga che il segno stesso è in dubbio: con
 * `+0.30R ± 0.80R` non sai nemmeno se la strategia guadagna.
 */
export function isNoise(expectancyR: number, stdErr: number): boolean {
  return stdErr > 0 && Math.abs(expectancyR) < stdErr * 2
}

/** La frase da mettere sotto il numero quando è ancora rumore. */
export function noiseHint(): string {
  return t('confidence.noise')
}
