# Frontend — Pagine

tags: #frontend #pages #react

---

## Routing

```
/login          → LoginPage       (pubblica)
/register       → RegisterPage    (pubblica)
/               → Dashboard       (protetta)
/log-trade      → LogTrade        (protetta)
/analytics      → Analytics       (protetta)
```

`ProtectedRoute` redirige a `/login` se non c'è token in `authStore`.

---

## Dashboard

**File:** `src/features/dashboard/Dashboard.tsx`  
**Dati:** [[../03 - API/Stats API]] via `useStats()`  
**Stato:** ✅ API reale connessa (issue #38)

### Sezioni

| Sezione | Dati | Stato |
|---------|------|-------|
| KPI Strip (5 cards) | `netPnL`, `winRate`, `avgRR`, `maxDrawdown`, `profitFactor` | ✅ reale |
| Equity Curve (SVG) | `dailyPnL[]` (cumulativo) | ✅ reale (#38) |
| Sessions | `sessionStats[]` | ✅ reale |
| Setup Performance | `setupStats[]` | ✅ reale |
| Statistics (6 KPI) | `bestTrade`, `worstTrade`, `avgWin`, `avgLoss`, `bestStreak`, `totalTrades` | ✅ reale |
| Recent Trades | `useTrades()` → tabella reale | ✅ reale (#40) |
| Activity Heatmap | `dailyPnL[]` (13 settimane) | ✅ reale (#38) |

### Loading / Error / Empty
- **Skeleton** condivisi (`KpiCardSkeleton`, `TableSkeleton`) mentre `isLoading` (#41)
- **Error banner** rosso in cima se `isError`
- **Empty state** (`EmptyState`) con CTA "Log a Trade" se `totalTrades === 0` (#41)

---

## LogTrade

**File:** `src/features/log-trade/LogTrade.tsx`  
**Dati:** [[../03 - API/Trade API]] via `useCreateTrade()`  
**Stato:** ✅ API reale connessa (issue #39)

### Campi del Form

**Trade Details:**
- Symbol, Date, Time
- Entry Price, Stop Loss, Take Profit, Exit Price
- Quantity

**Context:**
- Session (NY Open, London, Silver Bullet, Afternoon/Other)
- Setup (Breaker Block, ICT OB Entry, FVG, Liquidity Sweep, VWAP Rejection, Silver Bullet)
- HTF Bias (Bullish, Bearish, Neutral)
- Grade (A+, A, B, C)
- Tags (multi-select)

**Psychology:**
- Rationale (textarea)
- Emotional State (Calm & Focused, Confident, Anxious, Revenge, Bored)
- Mistakes (textarea)

**Screenshot Upload:** drop area + preview (placeholder, non ancora connessa a storage)

**Pre-Trade Checklist:** 7 item con progress bar
1. HTF trend confirmed
2. Killzone entry window
3. Key level identified
4. Entry model confirmed (LTF)
5. Risk defined (SL placed)
6. R:R ≥ 2
7. No conflicting news

### Submit Flow
1. Validazione client-side (campi required)
2. `mutate({ userId, ...formData })`
3. Loading spinner sul bottone
4. Success → Toast verde + reset form
5. Error → Toast rosso con messaggio
6. `invalidateQueries(['stats'])` → Dashboard si aggiorna

---

## Analytics

**File:** `src/features/analytics/Analytics.tsx`  
**Dati:** [[../03 - API/Stats API]] via `useStats(from, to)`  
**Stato:** ✅ collegata (issue #40) — skeleton/empty da #41

### Sezioni

| Sezione | Dati necessari | Stato |
|---------|---------------|-------|
| KPI Bar (7 metriche) | `netPnL`, `winRate`, `avgRR`, `profitFactor`, `maxDrawdown`, `avgHoldMinutes`, `bestStreak` | ✅ reale |
| Cumulative P&L Chart | `dailyPnL[]` → calcolo cumulativo | ✅ reale |
| Drawdown Analysis | `dailyPnL[]` → drawdown cumulativo | ✅ reale |
| Day of Week Bars | `dayOfWeekStats[]` | ✅ reale |
| Win/Loss Donut | `winCount`, `lossCount` | ✅ reale |
| Key Stats Table | `avgWin`, `avgLoss`, `bestTrade`, `worstTrade`, `avgHoldMinutes`, `bestStreak`, `worstStreak` | ✅ reale |
| Monthly Calendar | `dailyPnL[]` → raggruppato per mese | ✅ reale |
| Date Range Filter | query params `from` / `to` → `useStats` | ✅ reale |
| Export CSV | `trades[]` | ⏳ **da implementare** → [[../06 - Roadmap/Backlog]] |

> ⚠️ `avgHoldMinutes` mostra spesso **0**: il `POST` non setta `ExitTime` (solo il `PUT`), quindi l'hold non è calcolabile. Tech debt BE.

---

## Link Correlati
- [[Hooks & Services]] — hook e servizi usati dalle pagine
- [[State]] — authStore, TanStack Query
- [[../03 - API/Stats API]] — dati analytics
- [[../06 - Roadmap/Current Sprint]] — issue aperte
