# Architettura — Overview

tags: #architecture #backend #frontend

---

## Pattern: Clean Architecture

```
┌─────────────────────────────────────┐
│         Apex.API (Presentation)     │  ← Controllers, HTTP, Swagger, JWT
├─────────────────────────────────────┤
│         Apex.Domain (Business)      │  ← Services, Entities, DTO, Enums, Result<T>
├─────────────────────────────────────┤
│      Apex.Infrastructure (Data)     │  ← DbContext, Repositories, Migrations
└─────────────────────────────────────┘
        (Apex.Application — vuoto, vedi nota)
```

### Regola delle dipendenze
- Ogni layer dipende **solo** dal layer sotto di lui
- Flusso **reale**: `API` → `Domain` → `Infrastructure`
- `Infrastructure` non conosce `API`

> ⚠️ **Stato reale del codice:** il progetto `Apex.Application` esiste nella solution ma contiene solo `Class1.cs` (nessuna logica). I Service vivono in **`Apex.Domain/Services`** e `Apex.API` referenzia direttamente `Domain` e `Infrastructure`. Debito da risolvere: rimuovere `Application` oppure spostarvi i Service. Dettaglio componenti in [[Components]].

---

## Struttura Cartelle

```
apex-trading-journal/
├── backend/
│   └── Apex/
│       ├── Apex.API/              # Controllers, Program.cs, appsettings
│       ├── Apex.Domain/           # Entities, DTOs, Services, Enums, Contracts
│       ├── Apex.Application/      # IApplicationService
│       └── Apex.Infrastructure/   # AppDbContext, Repositories, Migrations
├── frontend/
│   └── src/
│       ├── components/            # UI riusabili (KpiCard, Layout, Sidebar)
│       ├── features/              # Feature-based: auth, dashboard, log-trade, analytics
│       ├── hooks/                 # Custom hooks TanStack Query
│       ├── services/              # Axios API clients
│       ├── store/                 # Zustand stores
│       ├── types/                 # TypeScript interfaces
│       └── router/                # React Router v7
├── docker-compose.yml             # PostgreSQL
└── .github/workflows/             # CI/CD
```

---

## Flusso di una Richiesta (end-to-end)

```
Browser (React)
    │
    │ HTTP + JWT header
    ▼
ASP.NET Core Controller
    │
    │ chiama Service
    ▼
Domain Service
    │
    │ chiama Repository
    ▼
EF Core Repository
    │
    │ query SQL
    ▼
PostgreSQL (Docker)
    │
    │ risultato
    ▼
Domain Service (calcola PnL, RR, Status)
    │
    │ AutoMapper Entity → DTO
    ▼
Controller → JSON Response
    │
    ▼
TanStack Query (cache 30s)
    │
    ▼
React Component (re-render)
```

---

## Stack Completo

### Backend
| Lib | Versione | Uso |
|-----|----------|-----|
| ASP.NET Core | 10.0 | Web framework |
| Entity Framework Core | 10.0.8 | ORM |
| FluentValidation | 11.3.1 | Validazione DTO |
| AutoMapper | latest | Entity ↔ DTO |
| BCrypt.NET | latest | Hash password |
| JWT Bearer | built-in | Auth token |
| Swagger/OpenAPI | 10.1.7 | Docs API dev |

### Frontend
| Lib | Versione | Uso |
|-----|----------|-----|
| React | 19.2.6 | UI |
| React Router | 7.15.1 | Routing |
| TanStack Query | 5.100.10 | Server state |
| Zustand | 5.0.13 | Client state |
| Axios | 1.16.1 | HTTP client |
| Tailwind CSS | 3.4.19 | Styling |
| Vite | 8.0.12 | Build/Dev server |
| TypeScript | 6.0.2 | Type safety |

---

## Link Correlati
- [[Components]] — deep-dive sui componenti e ciclo di vita di una richiesta
- [[../02 - Database/Schema]] — struttura DB
- [[../03 - API/Auth API]] — endpoint auth
- [[../04 - Frontend/State]] — state management
- [[../06 - Roadmap/Current Sprint]] — stato di implementazione
