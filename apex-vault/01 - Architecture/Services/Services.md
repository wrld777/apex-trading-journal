# 🗂 Service Map

tags: #service #backend #domain #index

> Indice dei service di dominio (`Apex.Domain/Services`) e delle loro relazioni.
> Architettura: [[../Components]] · [[../Overview]] · Home: [[../../🏠 Home]]

---

## Service di dominio

| Service | Responsabilità | Dipende da | Esposto da |
|---------|----------------|-----------|-----------|
| [[TradeService]] | CRUD trade + calcolo PnL/RR/Status | `ITradeRepository`, `IMapper` | [[../../03 - API/Trade API]] |
| [[StatsService]] | Aggregazione trade → `StatsDto` | `ITradeRepository` | [[../../03 - API/Stats API]] |
| [[AuthService]] | Register / Login (BCrypt) | `IUserRepository`, `IMapper` | [[../../03 - API/Auth API]] |
| [[ManageTokenService]] | Emissione JWT | `JwtSettings` | [[../../03 - API/Auth API]] (login) |

---

## Grafo delle dipendenze

```
                 ┌──────────────┐
                 │ AuthController│
                 └──┬────────┬───┘
        login/register      login
                 ▼            ▼
        [[AuthService]] ──►[[ManageTokenService]]   (composizione nel controller)
            │  emette JWT con userId ──────┐
            │                              │ il token validato fornisce lo userId
   IUserRepository                         ▼
                              [[TradeService]]   [[StatsService]]
                                   │  PnL/RR/Status ──► (dati) ──┘
                                   └────────┬───────────┘
                                     ITradeRepository (condiviso)
```

### Tipi di connessione
- **Composizione (controller):** `AuthService` → `ManageTokenService` nel `Login`. Nessuna DI diretta tra i due.
- **Dipendenza implicita sui dati:** `TradeService` calcola in scrittura i campi che `StatsService` aggrega in lettura.
- **Repository condiviso:** `TradeService` e `StatsService` usano entrambi `ITradeRepository`.
- **Identità a monte:** il JWT di `ManageTokenService`, validato dal middleware, fornisce lo `userId` ai service `[Authorize]`.

---

## Link Correlati
- [[../Components#1.2 Services Apex.DomainServices]] — i service nel quadro componenti
- [[../../06 - Roadmap/Current Sprint]] — stato implementazione / rischi (#68, JWT)
