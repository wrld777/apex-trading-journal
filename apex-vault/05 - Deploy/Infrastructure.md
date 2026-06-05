# Deploy & Infrastructure

tags: #deploy #docker #ci-cd

---

## Database — Docker PostgreSQL

### docker-compose.yml

```yaml
services:
  db:
    image: postgres:16
    container_name: apex_postgres
    environment:
      POSTGRES_DB:       apex_journal
      POSTGRES_USER:     apex
      POSTGRES_PASSWORD: apex_secret
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:    # dati persistenti tra restart
```

### Comandi

```bash
# Avvia PostgreSQL
docker-compose up -d

# Verifica che gira
docker ps

# Ferma (dati conservati)
docker-compose stop

# Ferma e distruggi dati
docker-compose down -v
```

---

## Backend — Avvio Locale

```bash
cd backend/Apex/Apex.API

# Applica migrations
dotnet ef database update --project ../Apex.Infrastructure

# Avvia
dotnet run

# → https://localhost:7106
# → Swagger: https://localhost:7106/swagger
```

**appsettings.json (dev):**
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=apex_journal;Username=apex;Password=apex_secret"
  },
  "JwtSettings": {
    "Secret": "chiave-segreta-minimo-32-caratteri-qui",
    "Issuer": "apex-api",
    "Audience": "apex-client",
    "ExpiryDays": 7
  }
}
```

---

## Frontend — Avvio Locale

```bash
cd frontend
npm install
npm run dev

# → http://localhost:5173
```

**frontend/.env:**
```
VITE_API_URL=https://localhost:7106
```

---

## CI/CD — GitHub Actions

**File:** `.github/workflows/`  
**Trigger:** Push su `develop` / PR verso `main`

> Da configurare: pipeline build + test + deploy automatico

### Workflow target (da implementare)

```yaml
# Proposta pipeline
on: [push, pull_request]

jobs:
  backend:
    - dotnet build
    - dotnet test

  frontend:
    - npm ci
    - npx tsc --noEmit
    - npm run build
```

---

## Produzione — Piano (da definire)

| Componente | Opzione consigliata | Note |
|-----------|---------------------|------|
| Backend API | Railway / Fly.io / Azure App Service | .NET 10 |
| Frontend | Vercel / Netlify | build Vite static |
| Database | Supabase / Railway PostgreSQL | managed |
| File Storage (screenshot) | Cloudflare R2 / S3 | da implementare |

### Env vars produzione (da configurare)
```
# Backend
ConnectionStrings__DefaultConnection=<prod-postgres-url>
JwtSettings__Secret=<chiave-sicura-prod>

# Frontend
VITE_API_URL=https://api.apexjournal.com
```

---

## CORS

Il backend accetta richieste **solo** da:
- `http://localhost:5173` (dev)
- Da aggiungere: URL produzione frontend

Configurato in `Program.cs`:
```csharp
builder.Services.AddCors(options => {
  options.AddPolicy("FrontendPolicy", policy =>
    policy.WithOrigins("http://localhost:5173")
          .AllowAnyHeader()
          .AllowAnyMethod());
});
```

---

## Link Correlati
- [[../02 - Database/Schema]] — struttura DB
- [[../01 - Architecture/Overview]] — architettura generale
- [[../06 - Roadmap/Backlog#Deploy]] — task deploy future
