# Current Sprint — Posizionamento e identità

tags: #roadmap #sprint

**Branch base:** `develop` (a `974b823` al 14/08/2026)
**Obiettivo:** togliere di mezzo tutto ciò che faceva sembrare l'app un gestore di conti funded, e darle un'identità coerente.

**Ordine deciso dall'utente il 13/08:** 1) via la logica conti → 2) tasti periodo → 3) ricognizione → 4) grafica e brand.

> Da qui in poi (13/08) sviluppa **Claude, backend e frontend**. L'utente decide e revisiona.

---

## Fatto in questo sprint

### ✅ #106 — Via il capitale, dentro l'R-multiplo
**PR [#107](https://github.com/wrld777/apex-trading-journal/pull/107)** — mergiata.
L'app si presentava come conto funded: header `Funded $150.000`, delta `% of capital`, un `CAPITAL = 150_000` **hardcoded** in `Analytics.tsx`. Nessuna di quelle misure dice quanto è buona una strategia: dipendono da quanto capitale dichiari.
Sostituite dall'**R-multiplo**: `PnL / (|entry − SL| × pointValue × qty)`, coi dollari affiancati. Rimosso `User.AccountSize` con migration.
- ⚠️ `Trade.RiskReward` **non** è l'R: `CalculateRR` usa valori assoluti, quindi è una magnitudine senza segno (un −1R risulta `rr = 1`). Convivono, non sono intercambiabili.
- `RMultiple` è `null`, non zero, quando lo stop coincide con l'entry: uno zero avrebbe sporcato tutte le medie.

### ✅ #108 — I tasti periodo non facevano niente
**PR [#109](https://github.com/wrld777/apex-trading-journal/pull/109)** — mergiata.
Non erano rotti: erano `<button>` **senza `onClick`**, con `1W` evidenziato fisso. Solo sulla Dashboard — Analytics aveva già un range da/a e StrategyAnalytics il toggle cablato.
Ora un solo `PeriodPicker` filtra tutta la pagina; la heatmap resta su query separata perché promette "Last 13 Weeks". Tolto `'May 2025'` inchiodato in `Topbar.tsx`.
- 🐛 Trovati e corretti due bug sul **profit factor**: era `avgWin/|avgLoss|` invece di lordo/lordo (3.00 invece di 9.00 sui dati di prova), e senza perdite tornava 0 facendo leggere "Negative edge" a un periodo chiuso al 100% di win.

### ✅ #110 — Profilo: anagrafica, foto, cambio password
**PR [#111](https://github.com/wrld777/apex-trading-journal/pull/111)** — mergiata.
`Instrument` era l'ultimo residuo del "conto funded" ed era usato in due soli punti decorativi — e non veniva nemmeno salvato in registrazione. Rimosso. `Name` → `FirstName`+`LastName`, foto come data URI ridimensionato lato client, cambio password con verifica della vecchia.
- ⚠️ **Migration critica:** EF scaffoldava `DropColumn Name` + `AddColumn FirstName`, che avrebbe azzerato il nome dei 10 utenti. Tenendo `FirstName` a 100 caratteri come il vecchio `Name`, EF genera `RenameColumn` e i dati sopravvivono.
- Fuori scope per decisione: reset password via email (manca il mittente), dati di fatturazione, fuso orario.

### ✅ #112 — Difetti della ricognizione
**PR [#113](https://github.com/wrld777/apex-trading-journal/pull/113)** — mergiata.
Giro completo su un account con 19 trade, 2 strategie e 4 strumenti misti. Sistemati: celle giganti di heatmap e calendario (colonne `1fr` + `aspect-square` → `minmax(0, Npx)`), `DayOfWeekChart` senza asse zero, `verdict()` senza il ramo "aderenza peggiore", Strategy Insights che confrontava in dollari, Setup Performance colorata sui dollari con numero in R, `Avg RR` con la "R" attaccata, colonna R nelle tabelle, numeri sulle card Strategie, `PAGE_META` completa.

---

## ✅ #114 — Lingua unica e rebrand — CHIUSA
**PR [#115](https://github.com/wrld777/apex-trading-journal/pull/115)** — mergiata in `develop`.
Inglese ovunque passando da un dizionario (`src/i18n/`): il tipo delle chiavi deriva dall'inglese, quindi una traduzione incompleta **non compila**. Nome **Apex → Rubric** (`Apex` collideva con Apex Trader Funding, una prop firm — puntava al mondo dei conti funded che lo sprint aveva appena tolto). Rebrand solo in superficie: namespace `Apex.*`, solution, repo e nome DB restano.
⚠️ Il dominio `.com` non sarà disponibile: serve una variante, da verificare prima di stampare qualsiasi cosa.

---

## 🚧 In corso — #116 Redesign enterprise

**Branch `feature/AJ-116`, otto commit — pushato, NON in PR.** Issue [#116](https://github.com/wrld777/apex-trading-journal/issues/116), tutte e otto le tappe spuntate.

**⚠️ Verifica visiva nel browser ancora da fare.** `tsc -b`, `eslint` e `vite build` sono puliti su tutte le tappe, ma l'estensione Chrome non era connessa: nessuna schermata è stata guardata dopo la tappa 3. Da fare **prima della PR**, con login reale su un account che ha trade, strategie e uscite parziali.

| Tappa | Commit | Cosa |
|---|---|---|
| 1 | `a8cf537` | Token, rampa dei grigi WCAG AA, scala tipografica |
| 2 | `30f9714` | Primitive: Button, Field/Input/Select, Card, Badge, Table, Modal, Toaster |
| 3 | `306dd01` | Telaio: AppShell, sidebar comprimibile, PageHeader |
| 4 | `5246402` | Fondamenta dei grafici + gli 8 grafici riscritti, con tooltip |
| 5 | `aa94fe0` | Contratto `StatCard`, `Stat`, `StatRow`, `Meter` |
| 6 | `cd51221` | LogTrade scomposto, convalida `zod`, errori accanto ai campi |
| 7 | `06aa503` | Marchio, favicon, wordmark |
| 8 | `a84f667` | Code-splitting per rotta, area di tocco, lint pulito |

### Decisioni prese strada facendo

- **Grafici in pixel misurati, non in `viewBox` stirato.** Con `preserveAspectRatio="none"` (la curva della Dashboard) lo stiramento non è uniforme: la linea da 2px era spessa 2px in verticale e mezzo in orizzontale. Con `meet`, i 9px di un'etichetta diventavano 5 o 14 a seconda della card. Ora `ResizeObserver` misura la larghezza e una unità SVG è un pixel CSS.
- **Le tre miniature sulle card KPI erano finte** — coordinate scritte a mano, uguali per ogni utente e ogni periodo. Quella del P&L netto ora è la curva vera; le altre due non hanno una serie dietro e sono sparite. Un grafico inventato accanto a un numero vero non è decorazione.
- **Tono e direzione sono cose diverse.** `KpiCard` aveva un solo `deltaUp` per il colore del valore *e* per il verso del confronto: un win rate del 49,8% usciva rosso, come un errore. Ora il tono è `neutral` di default e si colora solo ciò che ha un segno.
- **`react-hook-form` valutata e non usata.** Era fra le librerie approvate, ma LogTrade tiene stati che un gestore di form non modella comodamente (uscite parziali, aderenza per regola, strumenti filtrati dalla strategia). Lo schema `zod` serviva, il gestore no.
- **Marchio.** Le tre barre crescenti erano un istogramma, cioè il disegno di tutte le app di statistiche. Il nuovo segno è la *rubric*: tre righe, ognuna un criterio (quadratino in colore di marca) con la sua misura (barra). Favicon rifatta uguale — prima scheda del browser e sidebar mostravano due disegni diversi.
- **Il nome esce dal dizionario**: un marchio non si traduce, e `brand.name` invitava a farlo.

### Trovato e corretto per strada

- Il calendario scriveva **`+$0.1k` per una giornata da +$89**: arrotondamento che cancellava il numero invece di abbreviarlo.
- La ciambella win/loss erano tre `<circle>` con `strokeDasharray` e `linecap` arrotondato: le estremità di una fetta coprivano l'inizio della successiva, e con un 90% di vincite la fetta rossa spariva. Ora sono archi veri, e il pareggio è una terza fetta — senza, la somma non faceva il totale dei trade.
- Le barre di "giorno della settimana" e "impatto delle regole" partivano da un lato con larghezza pari al **valore assoluto**: +40 e −40 disegnavano la stessa barra.
- Nessuna convalida impediva **stop uguale all'entry**: un trade senza rischio definito, quindi senza R, che finiva nelle medie come `rMultiple: null`.
- Due frammenti di **codice morto** dalla tappa 2 (la stringa di classi di un `const` cancellato, sospesa a mezz'aria) e `App.css`, 184 righe di esempio Vite mai importate.

---

## Prossimo

1. **Verificare la #116 nel browser**, schermata per schermata, poi aprire la PR su `develop`.
2. **Deploy su VM** — 4 pre-requisiti ancora aperti, vedi `Da Discutere.md`: `docker-compose.yml` fuori sincrono con la realtà (Docker non installato, Postgres 18 nativo), JWT secret in chiaro committato, **nessun reset password** (su VM = lockout definitivo), `Microsoft.OpenApi` 2.4.1 con NU1903.

**Trappola di workflow:** `Closes #N` nelle PR **non chiude** le issue, perché GitHub lo applica solo al merge nel branch di default (`main`) e qui si mergia su `develop`. Vanno chiuse a mano con `gh issue close`.

**Trappola di verifica:** `npx tsc --noEmit` sulla root **non controlla niente** — `tsconfig.json` ha `files: []` e solo project reference. Usciva verde anche con un errore di sintassi JSX. Usare **`tsc -b`**.

---

# Archivio — US #5 Frontend API Integration

**User Story:** [#34 — US #5 Frontend API Integration](https://github.com/wrld777/apex-trading-journal/issues/34)  
**Branch base:** `develop`  
**Obiettivo:** Sostituire tutti i dati mock con dati reali dall'API

---

## Task

### ✅ #38 — Dashboard — Integrazione stats API reali
**Branch:** `feature/38-dashboard-stats-api` (PR [#46](https://github.com/wrld777/apex-trading-journal/pull/46)) + `feature/AJ-38` (PR [#48](https://github.com/wrld777/apex-trading-journal/pull/48))  
**Stato:** ✅ Completato e **mergiato in `develop`**

**Parte 1 (PR #46):**
- Hook `useStats` con TanStack Query su `GET /api/stats`
- KPI cards, Sessions, Setup Performance, Statistics → dati reali
- Skeleton loaders + error banner, nome utente dall'authStore

**Parte 2 (PR #48):**
- Equity Curve da `dailyPnL[]` (calcolo cumulativo, colore dinamico, label date reali)
- Activity Heatmap reale (finestra 13 settimane, tooltip per giorno)
- 🐛 Fix bug `winRate`: l'API ritorna 0–100 ma il FE moltiplicava ×100 (KPI, Sessions, Setup)

---

### ✅ #39 — Log Trade — useMutation POST /api/trade
**Branch:** `feature/39-log-trade-mutation` — PR [#47](https://github.com/wrld777/apex-trading-journal/pull/47)  
**Stato:** ✅ Completato e **mergiato in `develop`**

- `tradeService.create()` + hook `useCreateTrade` (`useMutation`)
- Form controllato, loading spinner, toast successo/errore, reset + invalidazione cache stats

---

### ✅ #40 — Analytics & Trade Log — dati reali + filtri
**Branch:** `feature/AJ-40` — PR [#49](https://github.com/wrld777/apex-trading-journal/pull/49)  
**Stato:** ✅ Completato e **mergiato in `develop`**

- [x] `tradeService.getByUser(userId)` + hook `useTrades()`
- [x] Analytics collegata a `useStats()` (KPI bar, Cumulative P&L, Drawdown, Day-of-Week, Win/Loss donut, Key Stats)
- [x] Monthly Calendar da `dailyPnL[]`
- [x] Dashboard Recent Trades → tabella reale da `GET /api/trade`
- [x] Filtro date-range (from/to) → `GET /api/stats`
- [x] 🐛 Fix rotta BE: `GET /api/trade/{userId}` era in conflitto con `/{id:guid}` → cambiata in **`GET /api/trade?userId=`**
- [x] 🐛 Fix `src/types/auth.ts` vuoto che rompeva il build
- [x] **Export CSV** — fatto poi in #54 ✅

---

### ✅ #41 — Polish — Skeleton loaders, empty states, env vars
**Branch:** `feature/AJ-41` — PR [#50](https://github.com/wrld777/apex-trading-journal/pull/50)  
**Stato:** ✅ Completato e **mergiato in `develop`**

- [x] Skeleton riutilizzabili: `Skeleton`, `KpiCardSkeleton`, `TableSkeleton` (usati in Dashboard + Analytics)
- [x] `EmptyState` component → Dashboard (0 trade, con CTA "Log a Trade") + Recent Trades
- [x] Toast globale (`toastStore` + `Toaster`) collegato all'`apiClient` su errori rete / 5xx
- [x] `.env` ignorato da git, `.env.example` tracciato, guard su `VITE_API_URL` mancante

---

## Ordine di Esecuzione

```
#38 ✅ → #39 ✅ → #40 ✅ → #41 ✅ → US #5 (#34) ✅ COMPLETATA
```

> ✅ **US #5 completata** — tutti i task mergiati in `develop`. La issue #34 può essere chiusa.

---

## 🚀 Sprint 2 — User Story post US #5

Create dai Bug / Tech Debt emersi (vedi [[Backlog#🐛 Bug / Tech Debt]]).

### ✅ [US #59 — Auth & Security Hardening](https://github.com/wrld777/apex-trading-journal/issues/59) `BE` — COMPLETATA
- [x] [#51](https://github.com/wrld777/apex-trading-journal/issues/51) — POST /api/trade usa utente autenticato (no userId hardcoded) ✅
- [x] [#52](https://github.com/wrld777/apex-trading-journal/issues/52) — `[Authorize]` su Trade/Stats + `userId` dal token (PR #67/#69) ✅
- ↳ inoltre: refactor auth (service solo DTO, token nel controller, register senza auto-login) ✅
- [x] [#68](https://github.com/wrld777/apex-trading-journal/issues/68) — ownership su GetById/Update/Delete (IDOR) ✅ (branch `feature/AJ-68`)
> La issue #59 può essere **chiusa** (entrambi i task fatti).

### ✅ [US #60 — Trade Management](https://github.com/wrld777/apex-trading-journal/issues/60) `FE` — COMPLETATA
- [x] [#54](https://github.com/wrld777/apex-trading-journal/issues/54) — Export CSV in Analytics ✅ (PR #62)
- [x] [#55](https://github.com/wrld777/apex-trading-journal/issues/55) — Pagina Trade Log dedicata (`/trades`) con filtri e sort ✅ (PR #65)
- [x] [#56](https://github.com/wrld777/apex-trading-journal/issues/56) — Edit & Delete trade ✅ (PR #74) — modale Edit, conferma Delete, hook update/delete, componente `Modal` riutilizzabile

### ✅ [US #61 — Data Accuracy & UX Polish](https://github.com/wrld777/apex-trading-journal/issues/61) — COMPLETATA
- [x] [#53](https://github.com/wrld777/apex-trading-journal/issues/53) — avgHoldMinutes: ExitTime al create `BE` ✅ (PR #72)
- [x] [#57](https://github.com/wrld777/apex-trading-journal/issues/57) — Migrare LogTrade al toast globale `FE` ✅ (PR #73)
- [x] [#58](https://github.com/wrld777/apex-trading-journal/issues/58) — Profilo utente + valori account dinamici `FE/BE` ✅ (PR #75) — pagina `/profile`, account size dinamico in Dashboard

---

## 🚀 Sprint 3 — Prossime funzionalità

Concordate il 25/06. Issue create su GitHub.

### ✅ [#68 — Ownership trade su GetById/Update/Delete](https://github.com/wrld777/apex-trading-journal/issues/68) `BE` — COMPLETATA
- Buco IDOR chiuso: i metodi del service ricevono lo `userId` dal token e trattano un trade altrui come `NotFound` (no information leak). ✅ (PR #78)

### ✅ [#76 — Screenshot trade](https://github.com/wrld777/apex-trading-journal/issues/76) `FE/BE` — COMPLETATA
**BE:** PR [#79](https://github.com/wrld777/apex-trading-journal/pull/79) · **FE:** PR [#80](https://github.com/wrld777/apex-trading-journal/pull/80) (mergiate)
- Approccio finale: **URL incollato dall'utente** con anteprima, **non** upload su disco. → [[../07 - Decisions/0002 - Screenshot come URL incollato dall'utente]] supera lo [[../07 - Decisions/0001 - Storage screenshot su disco locale|0001]].
- BE valida solo il **formato URL** (`Uri.TryCreate` + scheme http/https, no SSRF); FE valida formato + caricamento in `<img>`. → [[../08 - Learnings/Validare un URL immagine (incolla link)]]

### ✅ [#77 — Filtri + paginazione server-side su GET /api/trade](https://github.com/wrld777/apex-trading-journal/issues/77) `BE/FE` — COMPLETATA
**BE:** PR [#81](https://github.com/wrld777/apex-trading-journal/pull/81) (mergiata in `develop`) · **FE:** PR [#82](https://github.com/wrld777/apex-trading-journal/pull/82)
- **BE** (`GetPagedAsync` in repo/service/controller): query param `from,to,symbol,setup,session,direction,status,page,pageSize,sort,sortDir`, response `PagedList<TradeResponse>`; clamp su `page`/`pageSize`; rimossi `GetBySetupAsync`/`GetBySessionAsync`.
- 🐛 **Fix bug filtro date** trovato in verifica: `?from=2026-04-01` (data secca) → **500** per `Kind=Unspecified` → risolto con `SpecifyKind(..., Utc)`. → [[../08 - Learnings/DateTime UTC e Npgsql timestamptz (filtri data)]]
- **FE**: `getMine(query)` ritorna `PagedList`, `useTrades(query)` con `keepPreviousData`; TradeLog delega filtri/sort/paginazione al server (rimossa la logica client); Dashboard `pageSize:8`, Analytics `pageSize:100` per l'export. `to` reso inclusivo (+1 giorno). Verificato nel browser (login reale).

**Follow-up emersi (da tracciare come issue):**
1. `FE` Dropdown Setup/Session in TradeLog: opzioni dai 100 trade più recenti → serve un endpoint `GET /api/trade/facets` (valori distinti) per completezza.
2. `FE` Export CSV Analytics limitato a 100 trade/range (cap `pageSize` del BE) → iterare le pagine per export grandi.

> **Prossimi:** feature **Strategie** → [US #83](https://github.com/wrld777/apex-trading-journal/issues/83). Follow-up #77 aperti: endpoint `facets`, cap export. (#68 ✅, #76 ✅, #77 ✅)

---

## 🚀 Sprint 4 — Strategie

[US #83 — Strategie: unità di analisi con checklist di regole oggettive](https://github.com/wrld777/apex-trading-journal/issues/83) · decisione: [[../07 - Decisions/0003 - Strategie con checklist di regole oggettive e aderenza per-trade]]

- [x] [#84](https://github.com/wrld777/apex-trading-journal/issues/84) — **Fase 1** `BE+FE`: entità `Strategy`/`StrategyRule` + CRUD + pagina `/strategies` — ✅ **mergiata in `develop`**
- [x] [#85](https://github.com/wrld777/apex-trading-journal/issues/85) — **Fase 2** `FE+BE`: Log Trade selettore strategia + checklist dinamica + aderenza (`TradeRuleCheck`) — ✅ **BE+FE mergiati in `develop`** (PR #89/#90/#91) · anche `ExitTime` reso opzionale (trade ancora aperto)
- [ ] [#86](https://github.com/wrld777/apex-trading-journal/issues/86) — **Fase 3** `BE+FE`: analytics per strategia / per-regola / disciplina

> **Idea chiave:** registrare l'**aderenza** (quali regole rispettate per trade) separa "strategia debole" da "esecuzione indisciplinata".

#### #84 Fase 1 — avanzamento (al 20/07)

**Schema fissato** (nell'issue): `StrategyRule { Id, StrategyId, Label, Order, Required(bool) }`, niente `category`. `Label`=testo della regola, `Order`=posizione in lista (riordino ▲▼, ricalcolato da 0), `Required`=obbligatoria per validità del setup.

**FE ✅ FATTO** — branch `feature/AJ-84-fe` (**pushato**, commit `68e5c62`, no PR):
- `types/strategy.ts`, `strategyService`, `useStrategies` (query+mutation, invalidazione)
- pagina `/strategies`: lista a card + modale create/edit con editor regole (riordino + flag *Obbligatoria*) + conferma delete
- route `/strategies` + voce Sidebar. `tsc`+`eslint`+`vite build` puliti. **Non verificato E2E** (manca il BE).

**BE �её in corso (utente, live domani 21/07)** — fatto finora sul working tree (non committato):
- ✅ entità `Strategy`/`StrategyRule` (`Apex.Domain/Entities/`) — allineate a contratto FE
- ✅ `AppDbContext`: `DbSet` + config FK/cascade su `Users→Strategies` e `Strategies→StrategyRules`, maxlength
- ✅ migration `20260720214121_AddStrategyAndStrategyRule` **creata e applicata al DB dev**
- ⏳ **da fare:** `StrategyDto`(+`StrategyRuleDto`), request Create/Update, `StrategyProfile` (AutoMapper), Repository+Service (con **ownership dal token** come #68), `StrategyController` `[Authorize]` CRUD `/api/strategy`, Validator (nome non vuoto, ≥1 regola).

**⚠️ Contratto da rispettare** (per non ritoccare il FE): JSON **camelCase**, lista regole come **`rules`**. `StrategyDto = { id, name, description, rules:[{id,label,order,required}], createdAt }`; body create/update `{ name, description, rules:[{label,order,required}] }`.

**Prossimo:** finire BE → **verifica E2E** (login reale, crea/edita/elimina strategia) → PR `feature/AJ-84` + `feature/AJ-84-fe` su `develop`.

#### #85 Fase 2 — avanzamento (al 23/07)

**BE ✅ IMPLEMENTATO e VERIFICATO E2E** — branch `feature/AJ-85` (da pushare):
- Entità: `Trade.StrategyId (Guid?)` + `Trade.RuleChecks`; nuova `TradeRuleCheck { Id, TradeId (FK cascade), StrategyRuleId (FK Restrict), Checked }`. `AppDbContext` + `DbSet<TradeRuleChecks>`. Migration `20260723105157_TradeRule` **applicata al DB dev**.
- DTO/contratto: `TradeRuleCheckDto { strategyRuleId, checked }`; `TradeDto`/`CreateTradeRequest`/`UpdateTradeRequest`/`TradeResponse` con `strategyId` (nullable) + `ruleChecks`.
- `TradeRepository`: `.Include(RuleChecks)` in `GetByIdAsync`; in `UpdateAsync` i check nuovi forzati ad `Added` (replace, stesso trucco di `StrategyRepository`).
- `TradeService`: iniettato `IStrategyRepository`; helper `ApplyStrategyAndChecks` → **ownership** (strategia dev'essere dell'utente, come #68), i check devono appartenere a quella strategia, replace totale.
- Validator: guard su check duplicati sulla stessa regola.
- **E2E via curl (DB reale) OK**: happy path (aderenza salvata/riletta), senza strategia (null, no regressione), regola estranea → 400 VALIDATION, strategia altrui/inesistente → 400 NotFound, duplicati → 400 validator, update → riconciliazione replace.

> **Scelta di design (ADR 0003):** una regola `Required` **non spuntata non blocca** il salvataggio — registrare l'esecuzione indisciplinata è proprio il dato che vogliamo.

> **⚠️ Divergenza vs contratto pianificato:** la response espone `ruleChecks: [{ strategyRuleId, checked }]` **senza** `strategyName` né `label/order/required` arricchiti dal join. Sufficiente per il **submit** del FE (`LogTrade.tsx` legge le regole da `GET /api/strategy`). L'arricchimento servirà solo per *visualizzare* l'aderenza di un trade salvato o per l'analytics Fase 3 → da valutare al bisogno.

**FE ✅ FATTO** — branch `feature/AJ-85-fe` (basato su `feature/AJ-84-fe`, da pushare): `LogTrade.tsx` con selettore strategia + checklist guidata dalle regole (badge OBBL. su `required`, contatore "n/tot followed"), invio `strategyId` + `ruleChecks` al submit. Verificato **visivamente**; submit E2E da confermare col BE pushato.

**✅ CHIUSO (24/07):** BE `feature/AJ-85` pushato, FE `feature/AJ-85-fe` pushato, e FE Fase 1 `feature/AJ-84-fe` recuperato. Tutto mergiato in `develop` via PR **#89** (FE#84) → **#91** (FE#85) → **#90** (BE#85). Aggiunto `ExitTime` opzionale + `StrategyId` nullable nei request. **E2E end-to-end nel browser ancora da fare** (finora BE via curl ✅, FE visivo ✅) — consigliato prima di procedere con la Fase 3.

**Prossimo → Fase 3 #86:** analytics per strategia / per-regola / disciplina.

---

## 🧪 Dati di test (dev DB)
- Seminati **17 trade demo** (maggio 2026, mix win/loss, vari simboli/sessioni/setup) via `POST /api/trade`.
- Assegnati all'utente **`c746dce4…` (ahmedbejaoui@gmail.com)** — login con quell'account per vederli.
- ⚠️ `entryTime` deve essere **UTC con suffisso `Z`** (Npgsql rifiuta `timestamptz` con `Kind=Unspecified`).

---

## Link Correlati
- [[Backlog]] — funzionalità future dopo questo sprint
- [[../04 - Frontend/Pages]] — dettaglio delle pagine
- [[../04 - Frontend/Hooks & Services]] — hook da implementare
