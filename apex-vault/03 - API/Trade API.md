# API — Trade

tags: #api #trade #crud

Base path: `/api/trade`  
Autenticazione: **JWT Bearer richiesto** su tutti gli endpoint

---

## GET /api/trade

Ottieni i trade dell'**utente autenticato**, **filtrati, ordinati e paginati lato server** (#77).

**Auth:** `[Authorize]` — lo `userId` viene dal **token JWT** (claim `NameIdentifier`).

> 🐛 **Storia:** #40 → `?userId=` · #52 → userId dal token (nessun param) · **#77 → query param di filtro/sort/paginazione + response `PagedList`** (prima era un array piatto).

**Query param** (tutti opzionali):

| Param | Tipo | Default | Note |
|-------|------|---------|------|
| `from` / `to` | date | — | range su `EntryTime`. ⚠️ normalizzati a UTC lato BE ([[../08 - Learnings/DateTime UTC e Npgsql timestamptz (filtri data)]]) |
| `symbol` | string | — | match **parziale** (`Contains`) |
| `setup` / `session` | string | — | match **esatto** |
| `direction` | enum | — | `Long` / `Short` (bind per nome) |
| `status` | enum | — | `Win` / `Loss` / `BreakEven` |
| `page` | int | `1` | clamp: `< 1 → 1` |
| `pageSize` | int | `25` | clamp: fuori `1..100 → 25` |
| `sort` | string | `entryTime` | `entryTime` / `pnl` / `riskReward` / `symbol` |
| `sortDir` | string | `desc` | `asc` / `desc` |

> ⚠️ Non mandare param **vuoti**: `sort=`/`sortDir=`/`direction=` vuoti danno **400** (campo required / enum non parsabile). Il FE invia solo i param valorizzati.

**Response 200** — `PagedList<TradeResponse>`:
```json
{
  "items": [ { "id": "uuid", "symbol": "NQ", "direction": "Long", "pnL": 62.25, "status": "Win", "entryTime": "2025-05-13T09:30:00Z", "...": "resto del TradeDto" } ],
  "page": 1,
  "pageSize": 25,
  "total": 137
}
```

`total` è il conteggio **globale** dei trade che matchano i filtri (indipendente dalla pagina). Default sort: `EntryTime` DESC.

---

## GET /api/trade/{id}

Ottieni un singolo trade per ID.

**Params:** `id` (UUID nel path)

**Response 200:** stesso oggetto TradeDto sopra  
**Errori:** `404` se non trovato

---

## POST /api/trade

Crea un nuovo trade.

**Request body:**
```json
{
  "symbol": "NQ",
  "direction": "Long",
  "entryPrice": 18842.00,
  "stopLoss": 18800.00,
  "takeProfit": 18950.00,
  "exitPrice": 18904.25,
  "quantity": 1,
  "entryTime": "2025-05-13T09:30:00Z",
  "session": "New York Open",
  "setup": "Breaker Block",
  "htfBias": "Bullish",
  "grade": "A+",
  "rationale": "HTF FVG sweep con OB reazione",
  "emotionalState": "Calm & Focused",
  "mistakes": "",
  "tags": ["breaker", "fvg"],
  "userId": "uuid-utente"
}
```

**Campi NON da inviare** (calcolati dal backend):
- `pnL` — calcolato dal TradeService
- `riskReward` — calcolato dal TradeService
- `status` — determinato dal PnL

> ✅ **#51/#52:** `[Authorize]` + lo `userId` viene dal **claim JWT** (non dal body). Non inviare `userId`.
> ⚠️ `entryTime` deve essere **UTC** (`...Z`): Postgres `timestamptz` rifiuta `DateTime` con `Kind=Unspecified`.
> 🟠 `GetById`/`Update`/`Delete` hanno `[Authorize]` ma non verificano l'ownership → [#68](https://github.com/wrld777/apex-trading-journal/issues/68).

**Response 201:** TradeDto completo con campi calcolati  
**Errori:** `400` — validazione FluentValidation

### Calcoli Automatici nel TradeService

```
# PnL
Long:  PnL = (exitPrice - entryPrice) × quantity
Short: PnL = (entryPrice - exitPrice) × quantity

# Risk/Reward
Risk   = |entryPrice - stopLoss|
Reward = |takeProfit - entryPrice|
RR     = Reward / Risk

# Status
Win       → PnL > 0
Loss      → PnL < 0
BreakEven → PnL = 0
```

---

## PUT /api/trade/{id}

Aggiorna un trade esistente (es. dopo la chiusura).

**Params:** `id` (UUID nel path)

**Request body:**
```json
{
  "exitPrice": 18904.25,
  "exitTime": "2025-05-13T10:15:00Z",
  "rationale": "Setup confermato su LTF",
  "emotionalState": "Calm & Focused",
  "mistakes": "Entrato un po' tardi",
  "tags": ["breaker", "revisione"]
}
```

**Response 200:** TradeDto aggiornato  
**Errori:** `404` se non trovato

---

## DELETE /api/trade/{id}

Elimina un trade.

**Params:** `id` (UUID nel path)

**Response 204:** No content  
**Errori:** `404` se non trovato

---

## Frontend — Hooks

```typescript
// Leggi i propri trade (#40 ✅, userId dal token dopo #52)
useTrades() // → useQuery(['trades', userId], () => tradeService.getMine())

// Crea trade (#39 ✅)
const { mutate } = useCreateTrade()
mutate(formData)        // tradeService.create(data) — niente userId nel body
// onSuccess: invalida cache 'stats' e 'trades' → Dashboard si aggiorna
```

---

## Link Correlati
- [[../01 - Architecture/Services/TradeService]] — service che implementa questi endpoint
- [[Stats API]] — statistiche aggregate sui trade
- [[../02 - Database/Schema#TRADES]] — struttura tabella Trades
- [[../04 - Frontend/Hooks & Services]] — useCreateTrade, tradeService
- [[../04 - Frontend/Pages#LogTrade]] — form di inserimento
