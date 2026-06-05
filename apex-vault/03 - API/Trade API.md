# API — Trade

tags: #api #trade #crud

Base path: `/api/trade`  
Autenticazione: **JWT Bearer richiesto** su tutti gli endpoint

---

## GET /api/trade?userId={userId}

Ottieni tutti i trade di un utente.

**Query:** `userId` (UUID) — es. `GET /api/trade?userId=c746dce4-...`

> 🐛 **Fix #40:** prima era `GET /api/trade/{userId}` ma andava in conflitto di routing con `GET /api/trade/{id:guid}` (un GUID matchava la rotta più specifica `{id:guid}` → GetById, mascherando la lista). Spostato a query param, coerente con `Stats API`.

**Response 200:**
```json
[
  {
    "id": "uuid",
    "symbol": "NQ",
    "direction": "Long",
    "entryPrice": 18842.00,
    "stopLoss": 18800.00,
    "takeProfit": 18950.00,
    "exitPrice": 18904.25,
    "quantity": 1,
    "pnL": 62.25,
    "riskReward": 2.4,
    "entryTime": "2025-05-13T09:30:00Z",
    "exitTime": "2025-05-13T10:15:00Z",
    "status": "Win",
    "session": "New York Open",
    "setup": "Breaker Block",
    "htfBias": "Bullish",
    "grade": "A+",
    "rationale": "HTF FVG sweep con OB reazione",
    "emotionalState": "Calm & Focused",
    "mistakes": "",
    "tags": ["breaker", "fvg"],
    "createdAt": "2025-05-13T11:00:00Z"
  }
]
```

Ordinati per `EntryTime` DESC (più recenti prima).

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

> ⚠️ **Tech debt:** lo `userId` nel body **viene ignorato** — il controller usa un GUID **hardcoded** (`a000…0001`). Va sostituito con l'utente autenticato (claim JWT `NameIdentifier`). Vedi [[../06 - Roadmap/Backlog#Bug / Tech Debt]].
> ⚠️ `entryTime` deve essere **UTC** (`...Z`): Postgres `timestamptz` rifiuta `DateTime` con `Kind=Unspecified`.

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
// Leggi tutti i trade (#40 ✅)
useTrades() // → useQuery(['trades', userId], () => tradeService.getByUser(userId))

// Crea trade (#39 ✅)
const { mutate } = useCreateTrade()
mutate(formData)
// onSuccess: invalida cache 'stats' e 'trades' → Dashboard si aggiorna
```

---

## Link Correlati
- [[Stats API]] — statistiche aggregate sui trade
- [[../02 - Database/Schema#TRADES]] — struttura tabella Trades
- [[../04 - Frontend/Hooks & Services]] — useCreateTrade, tradeService
- [[../04 - Frontend/Pages#LogTrade]] — form di inserimento
