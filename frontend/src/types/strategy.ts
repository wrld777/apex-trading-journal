// A single objective entry condition inside a strategy's checklist.
export interface StrategyRuleDto {
  id: string
  label: string
  order: number
  required: boolean
}

// A trading strategy owned by the user. `rules` is the ordered checklist.
export interface StrategyDto {
  id: string
  name: string
  description: string
  rules: StrategyRuleDto[]
  // Strumenti su cui la strategia opera (#95). Solo gli id: il catalogo è già
  // in cache lato client, il simbolo si risolve da lì.
  instrumentIds: string[]
  createdAt: string
}

// Rule payload when creating/updating a strategy (no id — server assigns it).
export interface StrategyRuleInput {
  label: string
  order: number
  required: boolean
}

export interface CreateStrategyRequest {
  name: string
  description: string
  rules: StrategyRuleInput[]
  instrumentIds: string[]
}

// Same shape as create: the editor sends the full rule list every save.
export type UpdateStrategyRequest = CreateStrategyRequest
