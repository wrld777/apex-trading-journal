# ADR 0003 — Strategie con checklist di regole oggettive e aderenza per-trade

tags: #decision #adr

**Stato:** ✅ Accettata
**Data:** 2026-07-11 · **Ambito:** BE+FE · DB · Analytics · **Issue:** [#83](https://github.com/wrld777/apex-trading-journal/issues/83) ([#84](https://github.com/wrld777/apex-trading-journal/issues/84)/[#85](https://github.com/wrld777/apex-trading-journal/issues/85)/[#86](https://github.com/wrld777/apex-trading-journal/issues/86))

---

## Contesto
Oggi un `Trade` ha solo un `setup` (stringa libera): si può raggruppare, non diagnosticare. L'obiettivo è capire **dove una strategia funziona e in cosa manca**, per migliorarla. Il problema: un trade perso può voler dire due cose opposte — la strategia è debole, oppure non l'ho eseguita bene. Senza un modo per distinguerle, l'analytics non aiuta a decidere se cambiare la strategia o la disciplina.

## Opzioni considerate
1. **Solo `strategyId` sul trade** — semplice, ma dà solo win rate per strategia. Non distingue strategia debole da esecuzione indisciplinata. ❌ manca il "in cosa manca".
2. **Strategia + checklist salvata come JSON sul trade** — cattura l'aderenza, ma le voci sono opache: niente statistiche per singola regola. Analytics per-regola precluso.
3. **Strategia + regole come righe (`StrategyRule`) + aderenza per-trade (`TradeRuleCheck`)** — le voci di checklist sono **condizioni oggettive di ingresso** modellate come entità. Permette statistiche per singola regola e per livello di aderenza.

## Decisione
Scelta l'**opzione 3**: la strategia è l'unità di analisi, le sue regole sono **righe** (`StrategyRule`, condizioni oggettive), e per ogni trade si registra **quali regole erano rispettate** (`TradeRuleCheck`). Le regole sono oggettive (es. "prezzo sopra EMA200", "sweep di liquidità"), non promemoria soggettivi — è ciò che rende l'aderenza un dato analizzabile.

Modello:
```
Strategy (per utente): Name, Description, StrategyRule[]
StrategyRule: Label, Order, Required?
Trade: + StrategyId (FK, nullable)
TradeRuleCheck: StrategyRuleId, Checked   ← aderenza del singolo trade
```

Distinzione diagnostica che sblocca:

| Checklist seguita? | Esito | Significato |
|---|---|---|
| ✅ 100% | ❌ Loss | strategia debole → migliorare l'idea |
| ❌ violata | ❌ Loss | disciplina → strategia ok, esecuzione no |

## Conseguenze
- ✅ Analytics **per strategia** (win rate/expectancy con aderenza 100% vs no) e **per singola regola** (quale condizione, se saltata, fa più danno) → risponde a "dove va bene / in cosa manca".
- ✅ `setup` resta come sotto-categoria dentro la strategia: storico non buttato.
- ⚠️ Più tabelle e join (`StrategyRule`, `TradeRuleCheck`) e più migration rispetto al JSON.
- ⚠️ `StrategyId` nullable per i trade legacy → serve gestire il caso "senza strategia" (o DB svuotato per partire pulito — scelto in dev).
- 🔁 **Da rivedere quando:** se le regole diventassero prevalentemente soggettive/variabili, l'analytics per-regola perde valore e l'opzione JSON (2) tornerebbe competitiva.

---

## Link Correlati
- [[Decisions]] — registro
- [[../06 - Roadmap/Current Sprint]] — fasi #84/#85/#86
- [[../Excalidraw/Valutazione]] — schizzo iniziale dell'idea
- [[../03 - API/Trade API]] — `Trade` acquisisce `strategyId`
