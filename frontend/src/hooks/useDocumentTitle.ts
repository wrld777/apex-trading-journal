import { useEffect } from 'react'

import { t, type TranslationKey } from '../i18n'

/**
 * Il titolo della scheda del browser.
 *
 * Era fisso: `index.html` diceva "Rubric — Trading Journal" e nessuna rotta lo
 * toccava più. Con quattro schede aperte sulla stessa app — cosa che succede
 * mentre si confrontano Analytics e Trade Log — sono quattro schede
 * indistinguibili; e la cronologia registra otto pagine diverse sotto lo stesso
 * nome.
 */

const BRAND = 'Rubric'

/** Le rotte con parametri si riconoscono per prefisso, quindi l'ordine conta:
 *  la voce più specifica prima. */
const TITLES: [pattern: RegExp, key: TranslationKey][] = [
  [/^\/$/, 'nav.dashboard'],
  [/^\/analytics/, 'nav.analytics'],
  [/^\/log-trade/, 'nav.logTrade'],
  [/^\/trades\/[^/]+\/edit/, 'tradeLog.editTitle'],
  [/^\/trades\/[^/]+/, 'tradeDetail.pageTitle'],
  [/^\/trades/, 'nav.tradeLog'],
  [/^\/strategies/, 'nav.strategies'],
  [/^\/strategy-insights/, 'nav.insights'],
  [/^\/profile/, 'nav.profile'],
  [/^\/login/, 'auth.signIn'],
  [/^\/register/, 'auth.createAccount'],
]

/** Il titolo di una rotta, o solo il marchio se la rotta non è fra quelle note. */
export function titleFor(pathname: string): string {
  const match = TITLES.find(([pattern]) => pattern.test(pathname))
  return match ? `${t(match[1])} — ${BRAND}` : `${BRAND} — Trading Journal`
}

/** Tiene il titolo allineato al percorso corrente. */
export function useDocumentTitle(pathname: string) {
  useEffect(() => {
    document.title = titleFor(pathname)
  }, [pathname])
}
