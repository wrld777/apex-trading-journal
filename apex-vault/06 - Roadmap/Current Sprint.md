# Current Sprint — US #5 Frontend API Integration

tags: #roadmap #sprint #frontend

**User Story:** [#34 — US #5 Frontend API Integration](https://github.com/wrld777/apex-trading-journal/issues/34)  
**Branch base:** `develop`  
**Obiettivo:** Sostituire tutti i dati mock con dati reali dall'API

---

## Task

### ✅ #38 — Dashboard — Integrazione stats API reali
**Branch:** `feature/38-dashboard-stats-api` (PR [#46](https://github.com/wrld777/apex-trading-journal/pull/46)) + `feature/AJ-38` (PR [#48](https://github.com/wrld777/apex-trading-journal/pull/48))  
**Stato:** ✅ Completato e **mergiato in `develop`**

**Parte 1 (PR #46):**
- Hook `useStats` con TanStack Query su `GET /api/stats`
- KPI cards, Sessions, Setup Performance, Statistics → dati reali
- Skeleton loaders + error banner, nome utente dall'authStore

**Parte 2 (PR #48):**
- Equity Curve da `dailyPnL[]` (calcolo cumulativo, colore dinamico, label date reali)
- Activity Heatmap reale (finestra 13 settimane, tooltip per giorno)
- 🐛 Fix bug `winRate`: l'API ritorna 0–100 ma il FE moltiplicava ×100 (KPI, Sessions, Setup)

---

### ✅ #39 — Log Trade — useMutation POST /api/trade
**Branch:** `feature/39-log-trade-mutation` — PR [#47](https://github.com/wrld777/apex-trading-journal/pull/47)  
**Stato:** ✅ Completato e **mergiato in `develop`**

- `tradeService.create()` + hook `useCreateTrade` (`useMutation`)
- Form controllato, loading spinner, toast successo/errore, reset + invalidazione cache stats

---

### ✅ #40 — Analytics & Trade Log — dati reali + filtri
**Branch:** `feature/AJ-40` — PR [#49](https://github.com/wrld777/apex-trading-journal/pull/49)  
**Stato:** ✅ Completato e **mergiato in `develop`**

- [x] `tradeService.getByUser(userId)` + hook `useTrades()`
- [x] Analytics collegata a `useStats()` (KPI bar, Cumulative P&L, Drawdown, Day-of-Week, Win/Loss donut, Key Stats)
- [x] Monthly Calendar da `dailyPnL[]`
- [x] Dashboard Recent Trades → tabella reale da `GET /api/trade`
- [x] Filtro date-range (from/to) → `GET /api/stats`
- [x] 🐛 Fix rotta BE: `GET /api/trade/{userId}` era in conflitto con `/{id:guid}` → cambiata in **`GET /api/trade?userId=`**
- [x] 🐛 Fix `src/types/auth.ts` vuoto che rompeva il build
- [ ] ⚠️ **Export CSV** — NON ancora fatto (bottone placeholder) → vedi [[Backlog]]

---

### ✅ #41 — Polish — Skeleton loaders, empty states, env vars
**Branch:** `feature/AJ-41` — PR [#50](https://github.com/wrld777/apex-trading-journal/pull/50)  
**Stato:** ✅ Completato — **PR #50 APERTA (da revisionare/mergiare)**

- [x] Skeleton riutilizzabili: `Skeleton`, `KpiCardSkeleton`, `TableSkeleton` (usati in Dashboard + Analytics)
- [x] `EmptyState` component → Dashboard (0 trade, con CTA "Log a Trade") + Recent Trades
- [x] Toast globale (`toastStore` + `Toaster`) collegato all'`apiClient` su errori rete / 5xx
- [x] `.env` ignorato da git, `.env.example` tracciato, guard su `VITE_API_URL` mancante

---

## Ordine di Esecuzione

```
#38 ✅ → #39 ✅ → #40 ✅ → #41 ✅ (PR #50 da mergiare) → chiudi #34
```

> **Prossimo passo immediato:** mergiare PR #50, poi chiudere la User Story #34.

---

## 🧪 Dati di test (dev DB)
- Seminati **17 trade demo** (maggio 2026, mix win/loss, vari simboli/sessioni/setup) via `POST /api/trade`.
- Assegnati all'utente **`c746dce4…` (ahmedbejaoui@gmail.com)** — login con quell'account per vederli.
- ⚠️ `entryTime` deve essere **UTC con suffisso `Z`** (Npgsql rifiuta `timestamptz` con `Kind=Unspecified`).

---

## Link Correlati
- [[Backlog]] — funzionalità future dopo questo sprint
- [[../04 - Frontend/Pages]] — dettaglio delle pagine
- [[../04 - Frontend/Hooks & Services]] — hook da implementare
