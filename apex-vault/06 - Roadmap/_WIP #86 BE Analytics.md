---
tags: [wip, temp, "#86"]
stato: bozza-lavoro
creato: 2026-07-24
---

# #86 Fase 3 — Analytics Strategie (BE) · nota di lavoro

> ⚠️ **File temporaneo di lavoro.** Serve solo a guidare l'implementazione del BE. Da cancellare (o consolidare nel Current Sprint / ADR) a lavoro finito. Issue: [#86](https://github.com/wrld777/apex-trading-journal/issues/86) · dipende da Fase 2 #85 (aderenza registrata, ora in `develop`).

## 🎯 Obiettivo

Rendere la feature Strategie **utile** con le viste diagnostiche: "dove va bene / in cosa manca".
Il valore centrale (ADR 0003) è **separare "strategia debole" da "esecuzione indisciplinata"**:

- una strategia può avere numeri scarsi perché **la strategia è debole** (anche eseguita bene, non funziona)
- oppure perché **l'esecuzione è indisciplinata** (la strategia funziona quando la rispetti, ma spesso salti le regole)

L'aderenza per-trade (`TradeRuleCheck`, già salvata in Fase 2) è il dato che permette di distinguere i due casi.

## 📥 Cosa abbiamo già (Fase 2, in `develop`)

- `Trade.StrategyId (Guid?)` + `Trade.Strategy`
- `Trade.RuleChecks : List<TradeRuleCheck>` — ogni check = `{ StrategyRuleId, Checked (bool) }`
- `StrategyRule { Id, Label, Order, Required }`
- `Trade.Status` (Win/Loss/BreakEven), `Trade.PnL`, `Trade.RiskReward` già calcolati

## 🧩 Le 4 viste da produrre (dall'issue)

1. **Stats segmentabili per `strategyId`** — le stats globali esistenti, filtrate su una strategia.
2. **Per strategia** — winRate / expectancy / RR medio, con lo split **checklist 100% vs non**.
3. **Per singola regola** — impatto sul win rate quando la regola è **violata** (non spuntata).
4. **Disciplina nel tempo** — % di aderenza per settimana / mese (trend).

---

## ⚠️ Prerequisito unico: caricare i dati di aderenza

`TradeRepository.GetAllAsync` carica i trade **nudi** (nessun `Include`). Le analytics hanno bisogno di aderenza + strategia. **Primo tassello obbligatorio:** nuovo metodo repo.

```csharp
// ITradeRepository
Task<List<Trade>> GetForAnalyticsAsync(
    Guid userId, Guid? strategyId, DateTime? from, DateTime? to, CancellationToken ct);

// TradeRepository
var q = _context.Trades
    .Where(t => t.UserId == userId)
    .Include(t => t.Strategy)
    .Include(t => t.RuleChecks).ThenInclude(rc => rc.StrategyRule)
    .AsQueryable();
if (strategyId.HasValue) q = q.Where(t => t.StrategyId == strategyId);
if (from.HasValue)       q = q.Where(t => t.EntryTime >= from);
if (to.HasValue)         q = q.Where(t => t.EntryTime <= to);
return await q.ToListAsync(ct);
```

Senza gli `Include`, `t.RuleChecks` resta vuoto → tutte le metriche vengono zero.

---

## 🔀 2 decisioni di design da fissare

**D1 — "trade aderente al 100%" =**
- ✅ *consigliato:* **tutte** le regole del trade spuntate → `t.RuleChecks.Any() && t.RuleChecks.All(c => c.Checked)`
- alt: solo le regole `Required` spuntate
- denominatore = i check **salvati sul trade** (snapshot storico), NON le regole attuali della strategia (che potrebbero essere state modificate dopo)

**D2 — "aderenza" per il trend disciplina =**
- ✅ *consigliato:* per trade `checked / totale_check` (percentuale continua), poi **media** per periodo → es. 78%
- alt: solo % di trade "100% aderenti" nel periodo

> Nota storica: la FK `TradeRuleCheck → StrategyRule` è `Restrict`, quindi lo storico dei check regge anche se la strategia viene editata. Usa sempre i `RuleChecks` salvati sul trade come verità.

---

## 📐 Formule

**Per strategia** (per ogni strategia dell'utente con ≥1 trade):
- `winRate = win / total * 100`
- `expectancy = trades.Average(t => t.PnL)` (PnL medio per trade)
- `avgRR = trades.Average(t => t.RiskReward)`
- **lo split che dà valore:** gli stessi 3 numeri calcolati due volte, sul sottoinsieme `fully-adherent` (D1) e sul sottoinsieme `non-adherent`.
  → se "adherent" ha numeri buoni e "non-adherent" cattivi ⇒ **esecuzione indisciplinata**. Se entrambi cattivi ⇒ **strategia debole**.

**Per regola** (per ogni `StrategyRule` di una strategia, aggregando i suoi `TradeRuleCheck`):
- `timesEvaluated`, `timesRespected (Checked==true)`, `timesViolated (Checked==false)`
- `winRateRespected` = winRate dei trade dove quella regola era spuntata
- `winRateViolated` = winRate dei trade dove NON era spuntata
- `impact = winRateRespected - winRateViolated` → regole con impatto alto = quelle che, se salti, fanno più danno

**Disciplina nel tempo** (raggruppa per settimana/mese di `EntryTime`):
- `adherenceRate = media, sui trade del periodo, di (checked / totale_check)` (D2)
- ordina per data → serie del trend

---

## 🔌 Endpoint (tutti `[Authorize]`, `userId` dal claim, ownership come #68)

| Endpoint | Vista |
|---|---|
| `GET /api/stats?strategyId=...` *(estendi l'esistente)* | 1. segmentazione |
| `GET /api/analytics/strategies` | 2. per strategia (con split 100% vs non) |
| `GET /api/analytics/strategies/{id}/rules` | 3. impatto per regola |
| `GET /api/analytics/discipline?granularity=week\|month` | 4. trend disciplina |

Ownership: quando arriva uno `strategyId`, verifica che la strategia sia dell'utente (riusa `IStrategyRepository` + `StrategyErrors.NotFound`, stesso pattern di `TradeService.ApplyStrategyAndChecks`).

---

## ✅ Checklist implementazione (file per file)

- [ ] **`ITradeRepository` + `TradeRepository`** — metodo `GetForAnalyticsAsync` con gli `Include`
- [ ] **DTO** (`Apex.Domain/DTOs/`, camelCase): `StrategyStatsDto`, `RuleImpactDto`, `DisciplinePointDto` (+ eventuale wrapper con lo split adherent/non-adherent)
- [ ] **Service** — `IAnalyticsService`/`AnalyticsService` (oppure estendi `IStatsService`); metodi per le 4 viste; ownership sullo `strategyId`
- [ ] **Controller** — `strategyId` opzionale su `StatsController` + nuovo `AnalyticsController`
- [ ] **DI in `Program.cs`** se il service è nuovo
- [ ] **Nessuna migration** — solo lettura di dati esistenti
- [ ] **E2E via curl** con una strategia + trade misti (aderenti e non) per verificare che lo split abbia senso

## Riferimenti
- Stats esistenti (pattern da riusare): `Apex.Domain/Services/StatsService.cs`, `Apex.API/Controllers/StatsController.cs`
- Ownership pattern: `TradeService.ApplyStrategyAndChecks`
- ADR: `07 - Decisions/0003 - Strategie con checklist di regole oggettive e aderenza per-trade`
