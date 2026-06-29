c
# Backlog — Funzionalità Future

tags: #roadmap #backlog

Tutto ciò che viene dopo il completamento di US #5 (Frontend API Integration).  
Ordinato per priorità e dipendenze.

---

## 🐛 Bug / Tech Debt
> Emersi durante #40/#41 e il test con dati reali. Tracciati come issue, raggruppati nelle US [#59](https://github.com/wrld777/apex-trading-journal/issues/59) / [#60](https://github.com/wrld777/apex-trading-journal/issues/60) / [#61](https://github.com/wrld777/apex-trading-journal/issues/61).

### ✅ BE — `POST /api/trade` usa userId hardcoded → [#51](https://github.com/wrld777/apex-trading-journal/issues/51) — FATTO
Risolto: userId dal claim JWT `NameIdentifier` (merged).

### ✅ BE — Endpoint Trade/Stats senza `[Authorize]` → [#52](https://github.com/wrld777/apex-trading-journal/issues/52) — FATTO
Risolto: `[Authorize]` su Trade/Stats + `userId` dal token (GET non prende più il query param). FE allineato (PR #69).

### BE — `avgHoldMinutes` sempre 0 → [#53](https://github.com/wrld777/apex-trading-journal/issues/53)
**Severità:** Bassa · **Effort:** S  
`POST` non valorizza `ExitTime` (solo `PUT`), quindi l'hold non è calcolabile. → Decidere il modello: trade creato già "chiuso" (set `ExitTime` al create) vs flusso open→close.

### ✅ FE — Export CSV → [#54](https://github.com/wrld777/apex-trading-journal/issues/54) — FATTO
Bottone Export CSV in Analytics, filtrato per date range (merged).

### ✅ FE — Trade Log pagina dedicata → [#55](https://github.com/wrld777/apex-trading-journal/issues/55) — FATTO
Pagina `/trades` con tabella, filtri, sort, paginazione (merged).

### 🟠 BE — Ownership su GetById/Update/Delete → [#68](https://github.com/wrld777/apex-trading-journal/issues/68)
**Severità:** Media · **Effort:** S  
Hanno `[Authorize]` ma non verificano che il trade sia dell'utente loggato (IDOR). → Confrontare `Trade.UserId` col claim, `404/403` altrimenti.

### FE — Minori
- `LogTrade` usa un Toast locale → migrare al `toastStore` globale → [#57](https://github.com/wrld777/apex-trading-journal/issues/57)
- Header Dashboard + capitale `150000`/limite DD `7500` hardcoded → profilo utente → [#58](https://github.com/wrld777/apex-trading-journal/issues/58)
- Equity Curve: toggle `1D/1W/1M/3M` e badge "Live" sono decorativi (non funzionanti) → _da tracciare_

---

## Priorità Alta

### Screenshot Upload
**Dipende da:** Storage esterno (Cloudflare R2 / S3)  
**Effort:** M

- Backend: endpoint `POST /api/trade/{id}/screenshot` → upload file → ritorna URL
- Frontend: drop area in LogTrade funzionante, preview, rimozione
- Salva URL in `Trade.Screenshots[]`

---

### Filtri Avanzati Trade Log
**Sbloccato:** #40 ✅ (richiede pagina Trade Log dedicata)  
**Effort:** S

- Filtro per: Setup, Session, Direction, Status, Date Range
- Ricerca per Symbol
- Sort per colonna (PnL, Date, RR)
- Paginazione o infinite scroll

---

### Edit & Delete Trade
**Sbloccato:** #40 ✅ (endpoint `PUT`/`DELETE` già pronti lato BE)  
**Effort:** S

- Pulsanti Edit/Delete su ogni riga del Trade Log
- Modal di conferma per delete
- Form di edit (pre-compilato con dati esistenti) → `PUT /api/trade/{id}`

---

### Equity Curve Interattiva
**Sbloccato:** #40 ✅ (curva già data-driven, manca interattività)  
**Effort:** M

- Sostituire SVG custom con libreria chart (Recharts o Chart.js)
- Hover tooltip con data e PnL
- Zoom/pan su range di date
- Toggle 1D / 1W / 1M / 3M funzionante

---

## Priorità Media

### Profilo Utente
**Effort:** S

- Pagina `/profile` con: nome, email, strumento, account size
- `PUT /api/user/{id}` per aggiornare
- Cambio password

---

### Deploy Produzione
**Dipende da:** tutto il resto  
**Effort:** L  
Vedi [[../05 - Deploy/Infrastructure#Produzione]]

- Backend su Railway / Fly.io
- Frontend su Vercel
- DB su Supabase
- Configurare CORS produzione
- Configurare CI/CD GitHub Actions completo

---

### Notifiche & Alert
**Effort:** M

- Alert quando MaxDrawdown supera soglia (es. > 3%)
- Alert "No trade for 3 days"
- Statistiche settimanali via email (opzionale)

---

## Priorità Bassa / Idee

### Dashboard Personalizzabile
- Widget drag & drop
- Scegliere quali KPI mostrare

### Journaling / Note Giornaliere
- Pagina separata per note pre/post sessione di trading
- Non legata a un singolo trade

### Multi-Account
- Supporto più account (funded, personal, paper trading)
- Switch account nella sidebar

### Mobile App
- React Native con stesso backend
- Log trade veloce da mobile

### Backtesting Integration
- Import CSV da piattaforma (TradingView, NinjaTrader)
- Parsing automatico in Trade entries

---

## Link Correlati
- [[Current Sprint]] — cosa stiamo facendo adesso
- [[../05 - Deploy/Infrastructure]] — piano deploy
