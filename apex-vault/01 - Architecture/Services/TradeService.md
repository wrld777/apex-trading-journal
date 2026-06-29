# Service — TradeService

tags: #service #backend #domain #trade

> **Layer:** [[../Components#1.2 Services Apex.DomainServices|Domain / Services]] · **File:** `Apex.Domain/Services/TradeService.cs` · **Interfaccia:** `ITradeService`
> Indice servizi: [[Services|🗂 Service Map]] · Architettura: [[../Components]] · [[../Overview]]

---

## Responsabilità
CRUD dei trade dell'utente autenticato e **derivazione dei campi calcolati** (`PnL`, `RiskReward`, `Status`) a ogni create/update. È il proprietario della logica di business sui trade.

## API pubblica (`ITradeService`)
```csharp
Task<Result<List<TradeDto>>> GetAllAsync(Guid userId, CancellationToken ct);
Task<Result<TradeDto>>       GetByIdAsync(Guid id, CancellationToken ct);
Task<Result<TradeDto>>       CreateAsync(TradeDto dto, Guid userId, CancellationToken ct);
Task<Result<TradeDto>>       UpdateAsync(Guid id, TradeDto dto, CancellationToken ct);
Task<Result<bool>>           DeleteAsync(Guid id, CancellationToken ct);
```
Tutti gli esiti tornano come `Result<T>` (no eccezioni di flusso).

## Logica chiave — campi calcolati
Su `CreateAsync`/`UpdateAsync` lo userId/i numeri non si fidano del client:
```
PnL (Long)  = (ExitPrice - EntryPrice) × Quantity
PnL (Short) = (EntryPrice - ExitPrice) × Quantity
RR     = round(|ExitPrice - EntryPrice| / |EntryPrice - StopLoss|, 2)   // 0 se risk = 0
Status = PnL > 0 → Win · PnL < 0 → Loss · else BreakEven
```
> In `CreateAsync` viene anche forzato `trade.UserId = userId` (dal token). Dettaglio calcoli: [[../../02 - Database/Schema#Logica Calcoli Automatici TradeService]].

## Dipendenze (uscenti)
| Dipende da | Tipo | Uso |
|-----------|------|-----|
| `ITradeRepository` | repository | persistenza ([[../Components#1.4 Repositories Apex.InfrastructureRepositories|Infrastructure]]) |
| `IMapper` (AutoMapper) | mapping | `Trade` ↔ `TradeDto` |

## Usato da (entranti)
- **`TradeController`** → espone l'HTTP: [[../../03 - API/Trade API]]
- Lato FE consumato via [[../../04 - Frontend/Hooks & Services]] (`tradeService`, `useTrades`, `useCreateTrade`)

## Connessioni con altri service
- **[[StatsService]]** — non c'è dipendenza DI diretta, ma **dipendenza implicita sui dati**: StatsService aggrega proprio i campi `PnL`/`RiskReward`/`Status` che *questo* service calcola in scrittura. Se cambia la formula qui, cambiano le statistiche là.
- Condivide `ITradeRepository` con [[StatsService]].

## Sicurezza
- ✅ **IDOR risolto (#68)**: `GetByIdAsync/UpdateAsync/DeleteAsync` ricevono lo `userId` dal token e trattano un trade di un altro utente come `NotFound` (non ne rivelano l'esistenza). `CreateAsync` forza già `UserId` dal token. Vedi [[../Components#5. ⚠️ Rischi & debito architetturale]] e [[../../06 - Roadmap/Current Sprint]].

## Link Correlati
- [[../../03 - API/Trade API]] · [[../../02 - Database/Schema]] · [[StatsService]] · [[../Components]]
