# Architettura — Componenti Principali

tags: #architecture #components #backend #frontend

> Deep-dive sui componenti reali del sistema e su come collaborano.
> Per la visione d'insieme e lo stack vedi [[Overview]]. Punto di partenza del vault: [[🏠 Home]].

---

## Vista a blocchi (C4 — Container)

```
┌──────────────────────────────────────────────────────────────┐
│                      Browser (utente)                          │
│  React 19 SPA · Vite · Tailwind                                │
└───────────────┬──────────────────────────────────────────────┘
                │ HTTPS + JWT Bearer
                ▼
┌──────────────────────────────────────────────────────────────┐
│                 Apex.API (ASP.NET Core 10)                     │
│  Controllers · [Authorize] · CORS · JWT middleware · Swagger   │
└───────────────┬──────────────────────────────────────────────┘
                │ chiama interfacce (DI)
                ▼
┌──────────────────────────────────────────────────────────────┐
│                  Apex.Domain (business)                        │
│  Services · Entities · DTO · Enums · Result<T> · AutoMapper    │
└───────────────┬──────────────────────────────────────────────┘
                │ usa IRepository
                ▼
┌──────────────────────────────────────────────────────────────┐
│             Apex.Infrastructure (data access)                  │
│  AppDbContext (EF Core) · Repositories · Migrations            │
└───────────────┬──────────────────────────────────────────────┘
                │ Npgsql
                ▼
              PostgreSQL 16 (Docker)
```

> ⚠️ **Nota sul layering reale:** il progetto `Apex.Application` esiste nella solution ma è **vuoto** (solo `Class1.cs`). La business logic vive interamente in **`Apex.Domain/Services`**, e `Apex.API` referenzia direttamente `Domain` e `Infrastructure`. Il flusso effettivo è quindi `API → Domain → Infrastructure`. Vedi nota in [[Overview]].

---

## 1. Componenti Backend

### 1.1 Controllers (`Apex.API/Controllers`)
Sottili: validano l'input, estraggono lo `userId` dal token e delegano ai Service.

| Controller | Endpoint | Auth | Dettaglio |
|-----------|----------|------|-----------|
| `AuthController` | `POST /api/auth/register`, `/login` | pubblico | [[../03 - API/Auth API]] |
| `TradeController` | `GET/POST/PUT/DELETE /api/trade` | `[Authorize]` | [[../03 - API/Trade API]] |
| `StatsController` | `GET /api/stats` | `[Authorize]` | [[../03 - API/Stats API]] |

**Pattern userId-dal-token** (Trade/Stats):
```csharp
var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
if (!Guid.TryParse(userIdClaim, out var userId))
    return Unauthorized();
```
Lo `userId` **non** arriva mai dal client → previene lo spoofing (issue #52, fatto). Vedi anche [[../06 - Roadmap/Current Sprint]].

### 1.2 Services (`Apex.Domain/Services`)
Cuore della business logic. Ognuno dietro un'interfaccia in `Domain/Contracts`, registrato `Scoped` in [[Overview#Stack Completo|Program.cs]].

| Service | Interfaccia | Responsabilità | Nota dedicata |
|---------|-------------|----------------|---------------|
| `TradeService` | `ITradeService` | CRUD trade + calcolo **PnL / RR / Status** | [[Services/TradeService]] |
| `StatsService` | `IStatsService` | Aggrega i trade in `StatsDto` (KPI, streak, drawdown, raggruppamenti) | [[Services/StatsService]] |
| `AuthService` | `IAuthService` | Register/Login: hash e verifica password (BCrypt), ritorna **solo DTO** | [[Services/AuthService]] |
| `ManageTokenService` | `IManageTokenService` | Genera il JWT (claims + firma HMAC-SHA256) | [[Services/ManageTokenService]] |

> 🔑 Separazione voluta: `AuthService` non conosce i token; è il **controller** a chiamare `ManageTokenService`. Dettaglio in [[../03 - API/Auth API]].
> 🗂 Mappa completa dei service e delle loro dipendenze reciproche: [[Services/Services|Service Map]].

### 1.3 Calcoli automatici (`TradeService`)
Campi mai inviati dal client — li deriva il backend a create/update:
```
PnL (Long)  = (ExitPrice - EntryPrice) × Quantity
PnL (Short) = (EntryPrice - ExitPrice) × Quantity
Risk   = |EntryPrice - StopLoss|   ·   Reward = |ExitPrice - EntryPrice|
RR     = round(Reward / Risk, 2)
Status = PnL > 0 → Win · PnL < 0 → Loss · else BreakEven
```
> ℹ️ Il **Reward** dell'RR usa `ExitPrice` (RR realizzato), non `TakeProfit` (RR pianificato). Formula completa in [[../02 - Database/Schema#Logica Calcoli Automatici TradeService]].

### 1.4 Repositories (`Apex.Infrastructure/Repositories`)
Unico punto che tocca il DB via `AppDbContext`. Tutte le query Trade sono **filtrate per `userId`** (eccetto `GetByIdAsync`, vedi rischio sotto).
- `GetAllAsync(userId)` — ordina per `EntryTime` desc
- `GetByDateRangeAsync(userId, from, to)` — usato dalle stats con filtro date (`AsNoTracking`)
- `GetBySetupAsync` / `GetBySessionAsync` — esposti nel repo ma non ancora usati dai controller

### 1.5 Cross-cutting
- **`Result<T>`** (`Domain/Result`) — esito esplicito success/failure, niente eccezioni di flusso; gli errori usano gli enum in `Domain/EnumPattern` (`TradeErrors`, `AuthErrors`, …).
- **AutoMapper** — `TradeProfile`, `UserProfile`: mappature Entity ↔ DTO ↔ Request/Response.
- **FluentValidation** — es. `CreateTradeRequestValidator`, auto-validazione sui request DTO.
- **JWT middleware** — valida issuer/audience/lifetime/firma su ogni richiesta `[Authorize]`.

---

## 2. Componenti Frontend

### 2.1 Routing (`src/router/index.tsx`)
React Router v7. Le rotte applicative sono dietro `ProtectedRoute` (redirect a `/login` se manca il token).

| Path | Componente | Protetto |
|------|-----------|----------|
| `/login`, `/register` | `LoginPage`, `RegisterPage` | no |
| `/` | `Dashboard` | sì |
| `/log-trade` | `LogTrade` | sì |
| `/trades` | `TradeLog` | sì |
| `/analytics` | `Analytics` | sì |

Tutte le pagine protette sono figlie di `Layout` (Sidebar + Topbar). Dettaglio in [[../04 - Frontend/Pages]].

### 2.2 apiClient (`src/services/apiClient.ts`)
Istanza Axios condivisa, due interceptor:
- **request** → inietta `Authorization: Bearer <token>` leggendo da [[../04 - Frontend/State#authStore srcstoreauthstorets|authStore]]
- **response** → su `401` (non-auth route) chiama `clearAuth()` + redirect `/login`; su errore rete o `5xx` mostra un toast globale ([[../04 - Frontend/State|toastStore]])

### 2.3 Services (`src/services`)
Wrapper tipizzati sull'apiClient: `authService`, `tradeService` (`getMine`, `create`, …), `statsService`. Dettaglio in [[../04 - Frontend/Hooks & Services]].

### 2.4 Hooks (TanStack Query) (`src/hooks`)
Server-state: fetch + cache + invalidazione.
- `useStats(from?, to?)` → `['stats', userId, from, to]`
- `useTrades()` → `['trades', userId]`, `staleTime 30s`, `enabled: !!userId`
- `useCreateTrade()` → `useMutation`; on success invalida `['stats']` e `['trades']`

### 2.5 Store (Zustand) (`src/store`)
Client-state:
- **`authStore`** — `token/userId/name/email`, persistito in `localStorage` (`apex-auth`)
- **`toastStore`** — coda notifiche globali, renderizzata da `Toaster`

Approfondimento dei due livelli di stato in [[../04 - Frontend/State]].

---

## 3. Ciclo di vita di una richiesta (end-to-end)

Esempio: **creazione di un trade**.

```
LogTrade (form)
  └─ useCreateTrade().mutate(data)
       └─ tradeService.create(data)
            └─ apiClient POST /api/trade   [+ Bearer token via interceptor]
                 ▼
TradeController.Create
  ├─ userId ← claim NameIdentifier
  ├─ AutoMapper: CreateTradeRequest → TradeDto
  └─ ITradeService.CreateAsync(dto, userId)
       ├─ map DTO → Trade, set UserId
       ├─ calcola PnL / RR / Status
       └─ ITradeRepository.CreateAsync(trade)
            └─ AppDbContext.SaveChanges → INSERT PostgreSQL
                 ▲
            Result<TradeDto> ──► 201 Created (TradeResponse)
                 ▲
  onSuccess: invalidateQueries(['stats'],['trades'])
       └─ Dashboard / Analytics si ri-fetchano automaticamente
```

Confronta con il flusso lato stato in [[../04 - Frontend/State#Flusso Stato Completo]] e il flusso generico in [[Overview#Flusso di una Richiesta end-to-end]].

---

## 4. Mappa delle dipendenze tra concetti

```
[[Overview]] ── stack & layering
   │
   ├── [[Components]] (questa nota)
   │       ├── Controllers ──► [[../03 - API/Auth API]] · [[../03 - API/Trade API]] · [[../03 - API/Stats API]]
   │       ├── Services ─────► calcoli ► [[../02 - Database/Schema]]
   │       └── Frontend ─────► [[../04 - Frontend/Pages]] · [[../04 - Frontend/Hooks & Services]] · [[../04 - Frontend/State]]
   │
   └── deploy & run ──► [[../05 - Deploy/Infrastructure]]

stato lavori ──► [[../06 - Roadmap/Current Sprint]] · [[../06 - Roadmap/Backlog]]
```

---

## 5. ⚠️ Rischi & debito architetturale

| Tema | Dettaglio | Riferimento |
|------|-----------|-------------|
| **IDOR** | `GetByIdAsync/UpdateAsync/DeleteAsync` filtrano solo per `Id`, **non** per `userId`: un utente autenticato può leggere/modificare/eliminare trade altrui. | issue **#68** — [[../06 - Roadmap/Backlog#🐛 Bug / Tech Debt]] |
| **Scadenza JWT** | `ManageTokenService` usa `AddMinutes(30)` hardcoded e **ignora `JwtSettings.ExpiryDays` (7)**. | [[../03 - API/Auth API#JWT Token]] |
| **Layer Application vuoto** | `Apex.Application` non contiene logica; valutare se rimuoverlo o spostarvi i Service. | [[Overview]] |
| **Repo non sfruttati** | `GetBySetupAsync/GetBySessionAsync` esistono ma non sono esposti. | — |

---

## Link Correlati
- [[Overview]] — pattern, stack, struttura cartelle
- [[../02 - Database/Schema]] — entità persistite e calcoli
- [[../03 - API/Trade API]] — superficie HTTP dei Service
- [[../04 - Frontend/State]] — client/server state
- [[../06 - Roadmap/Current Sprint]] — stato di implementazione
