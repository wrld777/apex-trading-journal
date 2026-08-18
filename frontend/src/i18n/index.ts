import { en } from './en'

/**
 * Le chiavi valide sono quelle del dizionario inglese, che fa da riferimento.
 * Una seconda lingua si dichiara `Record<TranslationKey, string>`: se le manca
 * anche una sola voce **non compila**, quindi non si può spedire una traduzione
 * a metà senza accorgersene.
 */
export type TranslationKey = keyof typeof en
export type Dictionary = Record<TranslationKey, string>

const dictionaries: Record<string, Dictionary> = { en }

// Una sola lingua per ora. Quando ne arriva una seconda, questa diventa uno
// stato (context + preferenza salvata) senza toccare le chiamate a `t()`.
const locale = 'en'

/**
 * Testo per una chiave, con interpolazione di `{segnaposto}`.
 * Se una chiave manca a runtime si restituisce la chiave stessa: in pagina si
 * vede subito cosa non è stato tradotto, invece di uno spazio vuoto.
 */
export function t(key: TranslationKey, vars?: Record<string, string | number>): string {
  const dict = dictionaries[locale] ?? en
  const raw = dict[key] ?? key
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
