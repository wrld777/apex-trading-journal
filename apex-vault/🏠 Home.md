# APEX Trading Journal — Second Brain

> Documentazione completa del progetto. Ogni nota è collegata alle altre. Usa questo file come punto di partenza.

---

## Mappa del Vault

| Area | Note | Descrizione |
|------|------|-------------|
| [[01 - Architecture/Overview]] | Architettura | Clean Architecture, stack, flusso dati |
| [[02 - Database/Schema]] | Database | Tabelle, relazioni, indici |
| [[03 - API/Auth API]] | API Auth | Register, Login, JWT |
| [[03 - API/Trade API]] | API Trade | CRUD trade, calcoli automatici |
| [[03 - API/Stats API]] | API Stats | Statistiche, filtri per data |
| [[04 - Frontend/Pages]] | Pagine | Dashboard, LogTrade, Analytics |
| [[04 - Frontend/Hooks & Services]] | Hooks & Services | useStats, useCreateTrade, apiClient |
| [[04 - Frontend/State]] | State Management | Zustand authStore, TanStack Query |
| [[05 - Deploy/Infrastructure]] | Deploy | Docker, env vars, CI/CD |
| [[06 - Roadmap/Current Sprint]] | Sprint Attivo | Issue aperte, in corso, completate |
| [[06 - Roadmap/Backlog]] | Backlog | Funzionalità future, idee |

---

## Stato del Progetto

```
Backend  ████████████████████ 100% ✅
Frontend ████████░░░░░░░░░░░░  40% 🔄
Deploy   ████░░░░░░░░░░░░░░░░  20% ⏳
```

### Issue Aperte
- [x] [[06 - Roadmap/Current Sprint#39 - Log Trade POST]] — `feature/39-log-trade-mutation` ✅ PR #47
- [x] [[06 - Roadmap/Current Sprint#40 - Analytics dati reali]]
- [ ] [[06 - Roadmap/Current Sprint#41 - Polish & Skeleton]]

---

## Tech Stack Rapido

**Backend** → C# ASP.NET Core 10 · EF Core · PostgreSQL · JWT · FluentValidation  
**Frontend** → React 19 · TypeScript · TanStack Query · Zustand · Tailwind CSS · Vite  
**DB** → PostgreSQL 16 (Docker)  
**Auth** → JWT Bearer Token (7 giorni)
