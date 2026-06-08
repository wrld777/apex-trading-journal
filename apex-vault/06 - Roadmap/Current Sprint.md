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
- [x] **Export CSV** — fatto poi in #54 ✅

---

### ✅ #41 — Polish — Skeleton loaders, empty states, env vars
**Branch:** `feature/AJ-41` — PR [#50](https://github.com/wrld777/apex-trading-journal/pull/50)  
**Stato:** ✅ Completato e **mergiato in `develop`**

- [x] Skeleton riutilizzabili: `Skeleton`, `KpiCardSkeleton`, `TableSkeleton` (usati in Dashboard + Analytics)
- [x] `EmptyState` component → Dashboard (0 trade, con CTA "Log a Trade") + Recent Trades
- [x] Toast globale (`toastStore` + `Toaster`) collegato all'`apiClient` su errori rete / 5xx
- [x] `.env` ignorato da git, `.env.example` tracciato, guard su `VITE_API_URL` mancante

---

## Ordine di Esecuzione

```
#38 ✅ → #39 ✅ → #40 ✅ → #41 ✅ → US #5 (#34) ✅ COMPLETATA
```

> ✅ **US #5 completata** — tutti i task mergiati in `develop`. La issue #34 può essere chiusa.

---

## 🚀 Sprint 2 — User Story post US #5

Create dai Bug / Tech Debt emersi (vedi [[Backlog#🐛 Bug / Tech Debt]]).

### ✅ [US #59 — Auth & Security Hardening](https://github.com/wrld777/apex-trading-journal/issues/59) `BE` — COMPLETATA
- [x] [#51](https://github.com/wrld777/apex-trading-journal/issues/51) — POST /api/trade usa utente autenticato (no userId hardcoded) ✅
- [x] [#52](https://github.com/wrld777/apex-trading-journal/issues/52) — `[Authorize]` su Trade/Stats + `userId` dal token (PR #67/#69) ✅
- ↳ inoltre: refactor auth (service solo DTO, token nel controller, register senza auto-login) ✅
- ⚠️ follow-up aperto: [#68](https://github.com/wrld777/apex-trading-journal/issues/68) — ownership su GetById/Update/Delete (IDOR)
> La issue #59 può essere **chiusa** (entrambi i task fatti).

### 🔄 [US #60 — Trade Management](https://github.com/wrld777/apex-trading-journal/issues/60) `FE` — in corso
- [x] [#54](https://github.com/wrld777/apex-trading-journal/issues/54) — Export CSV in Analytics ✅ (PR #62)
- [x] [#55](https://github.com/wrld777/apex-trading-journal/issues/55) — Pagina Trade Log dedicata (`/trades`) con filtri e sort ✅ (PR #65)
- [ ] [#56](https://github.com/wrld777/apex-trading-journal/issues/56) — Edit & Delete trade ← **prossimo FE**

### ⏳ [US #61 — Data Accuracy & UX Polish](https://github.com/wrld777/apex-trading-journal/issues/61) — da fare
- [ ] [#53](https://github.com/wrld777/apex-trading-journal/issues/53) — avgHoldMinutes: ExitTime al create `BE`
- [ ] [#57](https://github.com/wrld777/apex-trading-journal/issues/57) — Migrare LogTrade al toast globale `FE`
- [ ] [#58](https://github.com/wrld777/apex-trading-journal/issues/58) — Profilo utente + valori account dinamici `FE/BE`

> **Prossimi:** #56 (Edit/Delete, FE), #68 (ownership, BE), poi US #61.

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
