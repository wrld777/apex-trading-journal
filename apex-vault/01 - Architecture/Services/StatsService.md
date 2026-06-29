# Service — StatsService

tags: #service #backend #domain #stats

> **Layer:** [[../Components#1.2 Services Apex.DomainServices|Domain / Services]] · **File:** `Apex.Domain/Services/StatsService.cs` · **Interfaccia:** `IStatsService`
> Indice servizi: [[Services|🗂 Service Map]] · Architettura: [[../Components]] · [[../Overview]]

---

## Responsabilità
Aggregare i trade di un utente in un singolo **`StatsDto`** (read-only). Non scrive nulla nel DB: pura computazione su una lista di trade.

## API pubblica (`IStatsService`)
```csharp
Task<Result<StatsDto>> GetStatsByUserAsync(Guid userId, CancellationToken ct);
Task<Result<StatsDto>> GetStatsByDateRangeAsync(Guid userId, DateTime from, DateTime to, CancellationToken ct);
```
Con 0 trade ritorna `new StatsDto()` (empty state, non un errore).

## Logica chiave — cosa calcola
- **KPI**: `NetPnL`, `WinRate`, `AvgRR`, `ProfitFactor`, `AvgWin/AvgLoss`, `Best/WorstTrade`, `AvgHoldMinutes`
- **Conteggi**: `TotalTrades`, `Win/Loss/BreakEvenCount`
- **Serie temporali**: `MaxDrawdown` (peak-to-trough cumulativo), `Best/WorstStreak`, `DailyPnL[]`
- **Raggruppamenti**: per `Session`, per `Setup`, per `DayOfWeek`

> `WinRate` è restituito in scala **0–100** (non 0–1) — fonte del bug FE corretto in #38. Vedi [[../../06 - Roadmap/Current Sprint]].

## Dipendenze (uscenti)
| Dipende da | Tipo | Uso |
|-----------|------|-----|
| `ITradeRepository` | repository | `GetAllAsync` / `GetByDateRangeAsync` (`AsNoTracking`) |

Nessun `IMapper`: costruisce `StatsDto` a mano.

## Usato da (entranti)
- **`StatsController`** → HTTP: [[../../03 - API/Stats API]]
- Lato FE: `useStats()` in [[../../04 - Frontend/Hooks & Services]] → Dashboard & Analytics ([[../../04 - Frontend/Pages]])

## Connessioni con altri service
- **[[TradeService]]** — **dipendenza implicita sui dati**: questo service somma/raggruppa i campi `PnL`/`RiskReward`/`Status` che TradeService calcola in scrittura. Condividono `ITradeRepository`.
- Nessuna dipendenza da [[AuthService]]/[[ManageTokenService]]: l'identità arriva già risolta come `userId` dal controller.

## Link Correlati
- [[../../03 - API/Stats API]] · [[TradeService]] · [[../../04 - Frontend/State]] · [[../Components]]
