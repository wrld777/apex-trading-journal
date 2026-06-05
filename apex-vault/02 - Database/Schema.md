# Database Schema

tags: #database #postgresql #schema

Provider: **PostgreSQL 16** (Docker)  
ORM: **Entity Framework Core 10**  
Connection: `Host=localhost;Port=5432;Database=apex_journal`

---

## Tabelle

### USERS

```sql
CREATE TABLE "Users" (
  "Id"           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  "Name"         VARCHAR(100)  NOT NULL,
  "Email"        VARCHAR(255)  NOT NULL UNIQUE,
  "PasswordHash" TEXT          NOT NULL,
  "Instrument"   TEXT,
  "AccountSize"  NUMERIC(18,4),
  "CreatedAt"    TIMESTAMPTZ   DEFAULT NOW()
);

CREATE UNIQUE INDEX IX_Users_Email ON "Users"("Email");
```

| Campo | Tipo | Note |
|-------|------|------|
| `Id` | UUID | PK, auto-generato |
| `Name` | VARCHAR(100) | Nome trader |
| `Email` | VARCHAR(255) | Unico |
| `PasswordHash` | TEXT | BCrypt hash |
| `Instrument` | TEXT | Es. "NQ Futures" |
| `AccountSize` | NUMERIC(18,4) | Saldo conto |
| `CreatedAt` | TIMESTAMPTZ | UTC |

---

### TRADES

```sql
CREATE TABLE "Trades" (
  "Id"             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  "Symbol"         VARCHAR(10)   NOT NULL,
  "Direction"      VARCHAR(50)   NOT NULL,   -- 'Long' | 'Short'
  "EntryPrice"     NUMERIC(18,4) NOT NULL,
  "StopLoss"       NUMERIC(18,4) NOT NULL,
  "TakeProfit"     NUMERIC(18,4) NOT NULL,
  "ExitPrice"      NUMERIC(18,4) NOT NULL,
  "Quantity"       INTEGER       NOT NULL,
  "PnL"            NUMERIC(18,4) NOT NULL,   -- calcolato automaticamente
  "RiskReward"     NUMERIC(18,4) NOT NULL,   -- calcolato automaticamente
  "EntryTime"      TIMESTAMPTZ   NOT NULL,
  "ExitTime"       TIMESTAMPTZ,
  "Status"         VARCHAR(50)   NOT NULL,   -- 'Win' | 'Loss' | 'BreakEven'
  "Session"        TEXT          NOT NULL,   -- 'New York Open', 'London', ecc.
  "Setup"          TEXT          NOT NULL,   -- 'Breaker Block', 'FVG', ecc.
  "HTFBias"        TEXT          NOT NULL,   -- 'Bullish' | 'Bearish' | 'Neutral'
  "Grade"          TEXT          NOT NULL,   -- 'A+' | 'A' | 'B' | 'C'
  "Rationale"      TEXT,
  "EmotionalState" TEXT,                     -- 'Calm' | 'Anxious' | 'Confident'
  "Mistakes"       TEXT,
  "Tags"           TEXT[],                   -- array: ['fvg', 'breaker']
  "Screenshots"    TEXT[],                   -- array di URL
  "UserId"         UUID          NOT NULL REFERENCES "Users"("Id") ON DELETE CASCADE,
  "CreatedAt"      TIMESTAMPTZ   DEFAULT NOW(),
  "UpdatedAt"      TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IX_Trades_UserId ON "Trades"("UserId");
```

| Campo | Tipo | Note |
|-------|------|------|
| `Id` | UUID | PK |
| `Symbol` | VARCHAR(10) | Es. "NQ", "ES" |
| `Direction` | VARCHAR(50) | Long / Short |
| `EntryPrice` | NUMERIC(18,4) | Prezzo entrata |
| `StopLoss` | NUMERIC(18,4) | Stop loss |
| `TakeProfit` | NUMERIC(18,4) | Take profit |
| `ExitPrice` | NUMERIC(18,4) | Prezzo uscita |
| `Quantity` | INTEGER | Numero contratti |
| `PnL` | NUMERIC(18,4) | **Auto-calcolato** dal service |
| `RiskReward` | NUMERIC(18,4) | **Auto-calcolato** dal service |
| `EntryTime` | TIMESTAMPTZ | UTC |
| `ExitTime` | TIMESTAMPTZ | Nullable |
| `Status` | VARCHAR(50) | Win / Loss / BreakEven (**auto**) |
| `Session` | TEXT | NY Open, London, Silver Bullet, ecc. |
| `Setup` | TEXT | Breaker Block, FVG, ICT OB, ecc. |
| `HTFBias` | TEXT | Higher timeframe bias |
| `Grade` | TEXT | Qualità dell'esecuzione |
| `Rationale` | TEXT | Motivazione pre-trade |
| `EmotionalState` | TEXT | Stato psicologico |
| `Mistakes` | TEXT | Errori / lezioni |
| `Tags` | TEXT[] | Array PostgreSQL |
| `Screenshots` | TEXT[] | Array di URL |
| `UserId` | UUID | FK → Users (cascade delete) |

---

## Relazioni

```
Users  1 ───────── N  Trades
       (cascade delete)
```

Un utente ha molti trade. Eliminare un utente elimina tutti i suoi trade.

---

## Logica Calcoli Automatici (TradeService)

Questi campi **non vengono mai inviati dal client** — li calcola il backend:

```
PnL (Long)  = (ExitPrice - EntryPrice) × Quantity
PnL (Short) = (EntryPrice - ExitPrice) × Quantity

Risk   = |EntryPrice - StopLoss|
Reward = |TakeProfit - EntryPrice|
RR     = Reward / Risk

Status = Win       se PnL > 0
         Loss      se PnL < 0
         BreakEven se PnL = 0
```

---

## Migrations

Gestite con EF Core CLI:
```bash
dotnet ef migrations add <NomeMigration> --project Apex.Infrastructure --startup-project Apex.API
dotnet ef database update --project Apex.Infrastructure --startup-project Apex.API
```

---

## Link Correlati
- [[../03 - API/Trade API]] — endpoint che scrivono su Trades
- [[../01 - Architecture/Overview]] — architettura generale
- [[../05 - Deploy/Infrastructure]] — come avviare PostgreSQL con Docker
