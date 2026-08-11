// Global, read-only instrument catalog (#94). Seeded server-side and not editable
// by the user, so it can be cached aggressively on the client.
export type InstrumentType = 'Future' | 'Cfd'

export interface InstrumentDto {
  instrumentId: string
  symbol: string
  instrumentName: string
  // Currency per point — what makes P&L money instead of points (#94).
  pointValue: number
  tickSize: number
  tickValue: number
  currency: string
  type: InstrumentType
}
