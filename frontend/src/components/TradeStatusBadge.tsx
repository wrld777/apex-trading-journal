
import type { TradeDto } from '../types/trade'
import { Badge } from '../design-system'

/**
 * L'esito di un trade.
 *
 * Era definito due volte, identico, in Dashboard e Trade Log: due copie della
 * stessa mappa di colori che sarebbero divergite alla prima modifica.
 */
const TONES = {
  Win: 'pos',
  Loss: 'neg',
  BreakEven: 'neutral',
} as const

export default function TradeStatusBadge({ status }: { status: TradeDto['status'] }) {
  return <Badge tone={TONES[status]}>{status}</Badge>
}
