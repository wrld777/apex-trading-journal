import { en } from './en'
import { it } from './it'

/**
 * Le chiavi valide sono quelle del dizionario inglese, che fa da riferimento.
 * Una seconda lingua si dichiara `Record<TranslationKey, string>`: se le manca
 * anche una sola voce **non compila**, quindi non si può spedire una traduzione
 * a metà senza accorgersene.
 */
export type TranslationKey = keyof typeof en
export type Dictionary = Record<TranslationKey, string>

const dictionaries: Record<string, Dictionary> = { en, it }

export const LOCALES = ['en', 'it'] as const
export type Locale = (typeof LOCALES)[number]

/** Come si chiama una lingua **nella lingua stessa**: è così che si riconosce
 *  in una tendina, anche da parte di chi non legge quella corrente. */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  it: 'Italiano',
}

const STORAGE_KEY = 'rubric.locale'

/**
 * La lingua del browser, se la conosciamo.
 *
 * `navigator.language` arriva come `it`, `it-IT`, `en-GB`: conta solo la parte
 * prima del trattino — un italiano svizzero e uno italiano leggono lo stesso
 * dizionario. Quello che non conosciamo ricade sull'inglese, che è la lingua di
 * riferimento del progetto.
 */
function detect(): Locale {
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language]
  for (const tag of languages) {
    const base = tag?.toLowerCase().split('-')[0]
    if (base && (LOCALES as readonly string[]).includes(base)) return base as Locale
  }
  return 'en'
}

/** La preferenza salvata, oppure `null` per "segui il sistema". */
export function storedLocale(): Locale | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved && (LOCALES as readonly string[]).includes(saved) ? (saved as Locale) : null
  } catch {
    // Modalità privata o storage negato: si segue il sistema, senza rompere nulla.
    return null
  }
}

/** La lingua che il sistema chiederebbe, ignorando la preferenza salvata. */
export const systemLocale: Locale = detect()

/**
 * La lingua attiva, decisa **una volta sola** all'avvio.
 *
 * Non è uno stato di React di proposito: parecchie tabelle di etichette
 * (`OUTCOME_LABELS`, i nomi dei giorni sugli assi) chiamano `t()` a livello di
 * modulo, cioè una volta all'import. Renderla reattiva significherebbe o
 * riscrivere quelle tabelle come funzioni, o convivere con schermate tradotte a
 * metà. Cambiare lingua ricarica la pagina: un istante di attesa in cambio di
 * zero stringhe rimaste indietro.
 */
export const locale: Locale = storedLocale() ?? systemLocale

/** Fissa la lingua e ricarica, oppure torna a seguire il sistema con `null`. */
export function setLocale(next: Locale | null) {
  try {
    if (next === null) localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // Senza storage la scelta non sopravvive al ricaricamento: meglio non
    // ricaricare affatto che mostrare la lingua vecchia come se fosse la scelta.
    return
  }
  window.location.reload()
}

/**
 * Testo per una chiave, con interpolazione di `{segnaposto}`.
 * Se una chiave manca a runtime si restituisce la chiave stessa: in pagina si
 * vede subito cosa non è stato tradotto, invece di uno spazio vuoto.
 */
export function t(key: TranslationKey, vars?: Record<string, string | number>): string {
  const dict = dictionaries[locale] ?? en
  const raw = dict[key] ?? en[key] ?? key
  if (!vars) return raw
  return raw.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  )
}

/** Sceglie singolare o plurale sulla stessa base di chiavi. */
export function tPlural(
  count: number,
  one: TranslationKey,
  many: TranslationKey,
  vars?: Record<string, string | number>,
): string {
  return t(count === 1 ? one : many, { count, ...vars })
}
