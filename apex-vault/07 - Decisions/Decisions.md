# 🧭 Decision Log (ADR)

tags: #decision #adr #index

> Registro delle **decisioni architetturali** importanti del progetto.
> Ogni decisione = una nota numerata (ADR = *Architecture Decision Record*): contesto, opzioni valutate, scelta, conseguenze.
> Nuova decisione → copia [[_Template ADR]] e incrementa il numero.

---

## Perché teniamo gli ADR
Una decisione (es. "dove salviamo gli screenshot?") ha un **perché** che si dimentica in fretta. L'ADR cattura il ragionamento, così tra 3 mesi sai *perché* hai scelto così e *quando* va rivisto.

---

## Registro

| # | Decisione | Stato | Data | Ambito |
|---|-----------|-------|------|--------|
| [[0003 - Strategie con checklist di regole oggettive e aderenza per-trade\|0003]] | Strategie con checklist di regole oggettive + aderenza per-trade | ✅ Accettata | 2026-07-11 | BE+FE · DB · Analytics · [#83](https://github.com/wrld777/apex-trading-journal/issues/83) |
| [[0002 - Screenshot come URL incollato dall'utente\|0002]] | Screenshot come URL incollato dall'utente | ✅ Accettata | 2026-06-29 | BE+FE · Storage · [#76](https://github.com/wrld777/apex-trading-journal/issues/76) |
| [[0001 - Storage screenshot su disco locale\|0001]] | Storage screenshot su disco locale | ♻️ Superata da [[0002 - Screenshot come URL incollato dall'utente\|0002]] | 2026-06-29 | BE · Storage · [#76](https://github.com/wrld777/apex-trading-journal/issues/76) |

---

## Link Correlati
- [[../01 - Architecture/Components]] — componenti impattati dalle decisioni
- [[../05 - Deploy/Infrastructure]] — vincoli di deploy/storage
- [[../08 - Learnings/Learnings]] — come abbiamo *implementato* ciò che decidiamo qui
