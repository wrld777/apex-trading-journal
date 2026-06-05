# API — Stats

tags: #api #stats #analytics

Base path: `/api/stats`  
Autenticazione: **JWT Bearer richiesto**

---

## GET /api/stats

Calcola e ritorna tutte le statistiche di un utente.

**Query params:**
| Param | Tipo | Obbligatorio | Descrizione |
|-------|------|-------------|-------------|
| `userId` | UUID | ✅ | ID utente |
| `from` | ISO 8601 date | ❌ | Data inizio range |
| `to` | ISO 8601 date | ❌ | Data fine range |

**Esempi:**
```
GET /api/stats?userId=uuid-...
GET /api/stats?userId=uuid-...&from=2025-05-01&to=2025-05-31
```

**Response 200:**
```json
{
  "netPnL": 18420.00,
  "winRate": 0.638,
  "avgRR": 2.14,
  "profitFactor": 3.62,
  "maxDrawdown": -2140.00,
  "avgHoldMinutes": 47.3,
  "totalTrades": 58,
  "winCount": 37,
  "lossCount": 21,
  "breakEvenCount": 0,
  "bestTrade": 3200.00,
  "worstTrade": -820.00,
  "avgWin": 641.00,
  "avgLoss": -299.00,
  "bestStreak": 7,
  "worstStreak": 3,
  "sessionStats": [
    { "session": "New York Open", "pnL": 9840.00, "totalTrades": 22, "winRate": 0.68 },
    { "session": "London", "pnL": 6280.00, "totalTrades": 14, "winRate": 0.71 }
  ],
  "setupStats": [
    { "setup": "Breaker Block", "pnL": 8240.00, "totalTrades": 15, "winRate": 0.82 },
    { "setup": "Fair Value Gap", "pnL": 3920.00, "totalTrades": 12, "winRate": 0.67 }
  ],
  "dayOfWeekStats": [
    { "day": "Monday", "pnL": 4200.00, "totalTrades": 10 },
    { "day": "Tuesday", "pnL": 3800.00, "totalTrades": 12 }
  ],
  "dailyPnL": [
    { "date": "2025-05-01", "pnL": 1240.00, "totalTrades": 2 },
    { "date": "2025-05-02", "pnL": -290.00, "totalTrades": 1 }
  ]
}
```

---

## Dettaglio Metriche

### KPI Principali
| Campo | Formula | Interpretazione |
|-------|---------|-----------------|
| `netPnL` | Σ PnL di tutti i trade | Profitto netto totale |
| `winRate` | WinCount / TotalTrades | Range 0–1 (es. 0.638 = 63.8%) |
| `avgRR` | Media di RiskReward | > 1.5 è buono |
| `profitFactor` | AvgWin / \|AvgLoss\| | > 2 = eccellente, < 1 = edge negativo |
| `maxDrawdown` | Peggior calo cumulativo | Valore negativo |
| `avgHoldMinutes` | Media durata trade | EntryTime → ExitTime |

### Breakdown per Sessione (`sessionStats`)
Raggruppa i trade per il campo `Session`. Utile per capire in quale sessione sei più profittevole.

### Breakdown per Setup (`setupStats`)
Raggruppa per `Setup`. Ti dice quali setup hanno il win rate e PnL migliori.

### Breakdown per Giorno (`dayOfWeekStats`)
Raggruppa per giorno della settimana. Utile per trovare i tuoi giorni peggiori e smettere di tradare in quei giorni.

### P&L Giornaliero (`dailyPnL`)
Array di ogni giorno con PnL e numero trade. Usato per l'Equity Curve e il Calendario Mensile.

---

## Frontend — Hook

```typescript
// src/hooks/useStats.ts
export function useStats(from?: string, to?: string) {
  const userId = useAuthStore((s) => s.userId)
  return useQuery({
    queryKey: ['stats', userId, from, to],
    queryFn: () => statsService.get({ userId: userId!, from, to }),
    enabled: !!userId,
    staleTime: 30_000,   // cache 30 secondi
  })
}
```

Questa cache viene invalidata automaticamente quando si crea un nuovo trade (`useCreateTrade` → `invalidateQueries(['stats'])`).

---

## Dove vengono usati i dati

| Campo | Usato in |
|-------|---------|
| `netPnL`, `winRate`, `avgRR`, `maxDrawdown`, `profitFactor` | [[../04 - Frontend/Pages#Dashboard]] KPI cards |
| `sessionStats` | Dashboard → sezione Sessions |
| `setupStats` | Dashboard → Setup Performance |
| `totalTrades`, `bestTrade`, `worstTrade`, `avgWin`, `avgLoss`, `bestStreak` | Dashboard → Statistics |
| `dailyPnL` | [[../04 - Frontend/Pages#Analytics]] Equity Curve |
| `dayOfWeekStats` | Analytics → Day of Week bars |
| `winCount`, `lossCount` | Analytics → Win/Loss donut |

---

## Link Correlati
- [[Trade API]] — i trade da cui vengono calcolate le stats
- [[../04 - Frontend/Hooks & Services#useStats]] — hook React
- [[../04 - Frontend/Pages#Dashboard]] — dove le stats appaiono
- [[../04 - Frontend/Pages#Analytics]] — pagina analytics completa
