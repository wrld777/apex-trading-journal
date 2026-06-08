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
Frontend ███████████████████░  95% 🔄
Deploy   ████░░░░░░░░░░░░░░░░  20% ⏳
```

### ✅ US #5 — Frontend API Integration (COMPLETATA)
- [x] #38 — Dashboard stats reali + charts (PR #46 + #48)
- [x] #39 — Log Trade POST (PR #47)
- [x] #40 — Analytics & Trade Log reali + filtri (PR #49)
- [x] #41 — Polish: skeleton, empty state, toast, env (PR #50)

### Sprint 2 — User Story post US #5
- [x] [US #59 — Auth & Security Hardening](https://github.com/wrld777/apex-trading-journal/issues/59) `BE` → #51 ✅, #52 ✅ (chiudibile) · follow-up #68
- [ ] [US #60 — Trade Management](https://github.com/wrld777/apex-trading-journal/issues/60) `FE` → #54 ✅, #55 ✅, **#56** ⬅️ prossimo
- [ ] [US #61 — Data Accuracy & UX Polish](https://github.com/wrld777/apex-trading-journal/issues/61) → #53, #57, #58 (da fare)

**Prossimo task:** #56 (Edit & Delete, FE) · poi #68 (ownership, BE)

> Dettaglio in [[06 - Roadmap/Current Sprint]] · Tech debt in [[06 - Roadmap/Backlog#🐛 Bug / Tech Debt]]

---

## Tech Stack Rapido

**Backend** → C# ASP.NET Core 10 · EF Core · PostgreSQL · JWT · FluentValidation  
**Frontend** → React 19 · TypeScript · TanStack Query · Zustand · Tailwind CSS · Vite  
**DB** → PostgreSQL 16 (Docker)  
**Auth** → JWT Bearer Token (7 giorni)
