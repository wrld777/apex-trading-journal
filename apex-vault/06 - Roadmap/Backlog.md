
# Backlog — Funzionalità Future

tags: #roadmap #backlog

Tutto ciò che viene dopo il completamento di US #5 (Frontend API Integration).  
Ordinato per priorità e dipendenze.

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
**Dipende da:** #40 (Analytics reale)  
**Effort:** S

- Filtro per: Setup, Session, Direction, Status, Date Range
- Ricerca per Symbol
- Sort per colonna (PnL, Date, RR)
- Paginazione o infinite scroll

---

### Edit & Delete Trade
**Dipende da:** #40  
**Effort:** S

- Pulsanti Edit/Delete su ogni riga del Trade Log
- Modal di conferma per delete
- Form di edit (pre-compilato con dati esistenti) → `PUT /api/trade/{id}`

---

### Equity Curve Interattiva
**Dipende da:** #40  
**Effort:** M

- Sostituire SVG statico con libreria chart (Recharts o Chart.js)
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
