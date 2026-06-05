# Current Sprint — US #5 Frontend API Integration

tags: #roadmap #sprint #frontend

**User Story:** [#34 — US #5 Frontend API Integration](https://github.com/wrld777/apex-trading-journal/issues/34)  
**Branch base:** `develop`  
**Obiettivo:** Sostituire tutti i dati mock con dati reali dall'API

---

## Task

### ✅ #38 — Dashboard — Integrazione stats API reali
**Branch:** `feature/38-dashboard-stats-api`  
**PR:** [#46](https://github.com/wrld777/apex-trading-journal/pull/46)  
**Stato:** Completato, PR aperta

**Cosa è stato fatto:**
- Hook `useStats` con TanStack Query su `GET /api/stats`
- KPI cards, Sessions, Setup Performance, Statistics → dati reali
- Skeleton loaders + error banner
- Nome utente dall'authStore

---

### ✅ #39 — Log Trade — useMutation POST /api/trade
**Branch:** `feature/39-log-trade-mutation`  
**PR:** [#47](https://github.com/wrld777/apex-trading-journal/pull/47)  
**Stato:** Completato, PR aperta

**Cosa è stato fatto:**
- `tradeService.create()` implementato
- Hook `useCreateTrade` con `useMutation`
- Form controllato con submit, loading spinner, toast successo/errore
- Reset form + invalidazione cache stats dopo successo

---

### 🔄 #40 — Analytics & Trade Log — dati reali + filtri
**Branch:** da creare → `feature/40-analytics-real-data`  
**PR:** da aprire  
**Stato:** Da iniziare

**Tasks:**
- [ ] Aggiungere `tradeService.getAll(userId)` in `tradeService.ts`
- [ ] Creare hook `useTrades()` in `useTrades.ts`
- [ ] Collegare Analytics a `useStats()` (KPI bar, charts, day-of-week, win/loss donut)
- [ ] Collegare Equity Curve a `dailyPnL[]` (calcolo cumulativo)
- [ ] Collegare Monthly Calendar a `dailyPnL[]`
- [ ] Trade Log table con dati reali da `GET /api/trade/{userId}`
- [ ] Filtri per data (from/to) → passati a `useStats(from, to)`
- [ ] Export CSV da lista trade

---

### ⏳ #41 — Polish — Skeleton loaders, empty states, env vars
**Branch:** da creare → `feature/41-polish`  
**PR:** da aprire  
**Stato:** Da iniziare (dopo #40)

**Tasks:**
- [ ] Skeleton loaders uniformi in Analytics
- [ ] Empty state su Dashboard se 0 trade ("Nessun trade ancora. Inizia dal Log Trade!")
- [ ] Empty state su Analytics
- [ ] Empty state su Trade Log table
- [ ] Verificare env vars (`VITE_API_URL`) configurate correttamente per dev e prod
- [ ] Gestione errore globale consistente (banner/toast unificati)

---

## Ordine di Esecuzione Consigliato

```
#38 ✅ → #39 ✅ → #40 🔄 → #41 ⏳ → chiudi #34
```

---

## Link Correlati
- [[Backlog]] — funzionalità future dopo questo sprint
- [[../04 - Frontend/Pages]] — dettaglio delle pagine
- [[../04 - Frontend/Hooks & Services]] — hook da implementare
