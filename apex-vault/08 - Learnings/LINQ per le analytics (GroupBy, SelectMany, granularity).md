# LINQ per le analytics: GroupBy, SelectMany, Where-split, granularity

tags: #learning #skill

**Data:** 2026-07-24 · **Contesto:** issue #86 (analytics Strategie, `AnalyticsService`) · **Area:** BE

---

## In una riga
Le analytics NON sono altro che **contare righe raggruppate**: `GroupBy` per raggruppare, `Where` per dividere in sottoinsiemi, `SelectMany` per "srotolare", `Average/Count` per i numeri. Nessuna magia, nessun SQL scritto a mano.

---

## I mattoni (uno per uno)

### 1. `GroupBy` = "raggruppa per…"
È il verbo centrale. Prende una lista piatta e la spezza in gruppi per una chiave.

```csharp
trades.GroupBy(t => t.StrategyId)   // → tanti gruppi, uno per strategia
// ogni gruppo "g" è a sua volta una lista di trade su cui poi conto:
.Select(g => new { Strategia = g.Key, Quanti = g.Count() })
```
- `g.Key` = il valore per cui ho raggruppato (la strategia)
- `g` = la lista dei trade di quel gruppo (ci faccio `.Count()`, `.Average()`, ecc.)

Chiave composta (più campi) → oggetto anonimo:
```csharp
.GroupBy(t => new { t.StrategyId, Nome = t.Strategy!.Name })
```

### 2. `Where` + un helper booleano = **lo split**
`Where` filtra. Se il filtro è una funzione che ritorna sì/no, divido la stessa lista in due tronconi:

```csharp
var adherent    = all.Where(IsFullyAdherent).ToList();       // spuntate tutte
var notAdherent = all.Where(t => !IsFullyAdherent(t)).ToList(); // saltata almeno una

private static bool IsFullyAdherent(Trade t) =>
    t.RuleChecks.Any() && t.RuleChecks.All(c => c.Checked);
```
`IsFullyAdherent` è il cuore concettuale: guarda le spunte del trade e dice "aderente sì/no". È la separazione "trade fatti bene" vs "trade con regole saltate".
- `.Any()` = "ce n'è almeno uno?"
- `.All(c => c.Checked)` = "sono TUTTI spuntati?"

### 3. `SelectMany` = "srotola" (appiattisci) ⭐ quello nuovo
Problema: a volte non voglio ragionare **per trade**, ma **per singola spunta**. Ogni trade ha una lista di `RuleChecks` (una lista dentro ogni elemento).

- `Select` → mi darebbe una **lista di liste** (una lista di spunte per ogni trade). Scomodo.
- `SelectMany` → **appiattisce tutto in un'unica lista** di spunte.

```csharp
// da: [ trade1{check A, check B}, trade2{check A, check B} ]
// a:  [ A, B, A, B ]   ← una riga per spunta, non per trade
var flat = trades.SelectMany(t => t.RuleChecks.Select(c => new
{
    c.StrategyRuleId,
    c.Checked,
    IsWin = t.Status == TradeStatus.Win   // mi porto dietro l'esito del trade
}));
```
Il trucco: mentre srotolo, **appiccico a ogni spunta l'esito del trade** (`IsWin`). Così poi posso raggrupparle per regola e chiedere "quando questa regola era saltata, quanti erano win?".

Regola pratica: **lista-dentro-lista → SelectMany**. Un solo livello → Select.

### 4. `granularity` = un parametro che decide "settimana o mese"
Non è una parola di C#: è un **nome che ho scelto io** per un parametro (una stringa `"week"` o `"month"`) che decide **quanto grosso** è il raggruppamento temporale. "Granularità" = fine (settimana) o grossa (mese).

Serve a calcolare l'inizio del periodo a cui appartiene un trade, che poi diventa la chiave del `GroupBy`:
```csharp
private static DateTime PeriodStart(DateTime d, string granularity) =>
    granularity == "month"
        ? new DateTime(d.Year, d.Month, 1, 0,0,0, DateTimeKind.Utc)  // 1° del mese
        : d.Date.AddDays(-(int)d.DayOfWeek);                         // inizio settimana

// uso:
trades.GroupBy(t => PeriodStart(t.EntryTime, granularity))
```
Tutti i trade dello stesso mese cadono sulla stessa chiave (`1 luglio`) → finiscono nello stesso gruppo → un punto del grafico. Cambiando `granularity` cambio la dimensione dei bucket senza riscrivere la logica.

> `?:` è l'**operatore ternario**: `condizione ? valoreSeVero : valoreSeFalso`. Un `if/else` compatto su una riga.

### 5. I numeri finali: `Count`, `Average`, `Round`
Identici a quelli già in `StatsService.CalculateStats`:
```csharp
WinRate = total > 0 ? Math.Round((decimal)wins / total * 100, 2) : 0;
Expectancy = trades.Average(t => t.PnL);   // PnL medio per trade
```
`(decimal)` prima della divisione serve o la divisione tra interi tronca (7/10 = 0!).

---

## Trappole / cose che mi hanno bloccato
- ⚠️ **`.Include` dimenticato nel Repository** → `t.RuleChecks` arriva **vuoto** e tutte le analytics danno 0. Il Service *presume* che le spunte siano già caricate; è il Repository che deve fare `.Include(t => t.RuleChecks).ThenInclude(rc => rc.StrategyRule)`. Bug numero uno.
- ⚠️ **Divisione tra interi**: `wins / total` con due `int` tronca a 0. Castare a `(decimal)` prima.
- ⚠️ **Divisione per zero**: sempre `total > 0 ? ... : 0`.
- ⚠️ `SelectMany` vs `Select`: se ottieni una "lista di liste" e LINQ si lamenta, quasi sempre volevi `SelectMany`.

## Quando lo riuso
Ogni volta che devo produrre un report/aggregato: raggruppare per qualcosa, dividere in sottoinsiemi (per confrontarli), o appiattire una relazione uno-a-molti (trade→spunte, ordine→righe, ecc.).

---

## Link Correlati
- [[Learnings]]
- Nota di lavoro: [[../06 - Roadmap/_WIP #86 BE Analytics]]
- Stats esistenti da cui ho copiato la forma: `Apex.Domain/Services/StatsService.cs`
- [[DateTime UTC e Npgsql timestamptz (filtri data)]] — perché uso `DateTimeKind.Utc` nei periodi
