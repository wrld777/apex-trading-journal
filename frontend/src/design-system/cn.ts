import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Unisce classi condizionali e risolve i conflitti Tailwind.
 *
 * Serve perché una primitiva accetta `className` da chi la usa: senza
 * `twMerge`, `<Button className="px-6">` produrrebbe `px-3 px-6` e vincerebbe
 * quella che sta più avanti nel foglio di stile, non quella scritta dal
 * chiamante. Con il merge vince sempre l'ultima dichiarata.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
