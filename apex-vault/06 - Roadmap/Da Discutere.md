# Da Discutere — Inbox

tags: #roadmap #inbox

> Buttaci dentro tutto quello che ti viene in mente mentre usi l'app, anche a mezza frase.
> Non serve che sia ordinato o completo: ci passiamo insieme e trasformiamo in issue quello che vale la pena.
> Quando una voce diventa una issue, linkala e barrala.

---

## 🐛 Robe da sistemare
_Bug, attriti, cose che non funzionano come ti aspetti mentre inserisci i trade._

- ~~gli asset e le size: per i futures sapopiamo che ci sono i mico e i mini vanno definiti.~~ → [#94](https://github.com/wrld777/apex-trading-journal/issues/94)
  🐛 **Scavando è emerso un bug più grave:** `TradeService.CalculatePnL` non applica nessun moltiplicatore di contratto (`diff × Quantity` e basta). Il PnL è in *punti × contratti*, non in dollari → +10 su 1 MNQ ($20) e +10 su 1 NQ ($200) risultano identici. Tutte le stats e le analytics sono inaffidabili appena si mescolano strumenti. **Da fare per primo**, e va ricalcolato il PnL dei trade già inseriti.
- ~~gli asset si scrivono molto brutto meglio includere nella strategia quando la creiamo su quali asset va a lavorare tipo ES MNQ o NQ o GC per adesso gestiamo solo futures e poi vediamo per i CFD~~ → [#95](https://github.com/wrld777/apex-trading-journal/issues/95)
  Deciso: catalogo strumenti **globale** (seed, non modificabile dall'utente per ora). Solo futures; l'enum `InstrumentType` esiste già per i CFD futuri.
  ✅ **Implementato** — BE [PR #100](https://github.com/wrld777/apex-trading-journal/pull/100), FE [PR #101](https://github.com/wrld777/apex-trading-journal/pull/101). Many-to-many con join table `StrategyInstruments`; chip nel modale strategia e select del Log Trade filtrato sulla strategia scelta.
- ~~un trade puo terminare a tp o be o sl o parziale. Non mi piace la scelta di mettere prezzo di uscita impiego piu  tempo meglio fare una cosa piu pratica, per i parziali possiamo aggiungere diverse exit nel caso e segnare i contratti scalati~~ → [#96](https://github.com/wrld777/apex-trading-journal/issues/96)
  Deciso: **il trade si registra sempre già chiuso** — niente flusso apri→chiudi, niente stato "parzialmente aperto". I parziali sono il dettaglio di *come* si è usciti. Chiude anche il vecchio nodo su `avgHoldMinutes` ([#53](https://github.com/wrld777/apex-trading-journal/issues/53)).
  ✅ **Implementato** — BE [PR #102](https://github.com/wrld777/apex-trading-journal/pull/102), FE [PR #103](https://github.com/wrld777/apex-trading-journal/pull/103). Bottoni TP/SL/BE/Manuale col prezzo derivato dai livelli, sezione parziali a scomparsa, PnL come somma delle uscite. Chiude anche la [#98](https://github.com/wrld777/apex-trading-journal/issues/98) (TP obbligatorio pur essendo opzionale).
- ~~quando apro la webapp sembra che gestisce i conti, noi stiamo gestrendo i numeri che genera la strategia, quindi non ci sono conti funded e cazzate varie, devo assicurarmi che parlo solo di percentuali e di fornire statistiche ottime per determinare l'efficenza della startegia. 10/08/2026~~ → [#106](https://github.com/wrld777/apex-trading-journal/issues/106)
  Deciso: il capitale sparisce e al suo posto arriva l'**R-multiplo** (`PnL / (|entry−SL| × pointValue × qty)`), coi dollari affiancati come riferimento. Via `User.AccountSize` (migration `RemoveUserAccountSize`), via il `CAPITAL = 150_000` hardcoded in `Analytics.tsx` e la linea "-5% limit", via `Funded $…` dalla Dashboard.
  Nota: `Trade.RiskReward` **non** è l'R — è una magnitudine senza segno (un −1R risulta `rr = 1`). Le due metriche convivono.

### ~~Ricognizione del 14/08/2026~~ → [#112](https://github.com/wrld777/apex-trading-journal/issues/112)
Giro completo di tutte le schermate su un account con 19 trade, 2 strategie, 4 strumenti misti e qualche uscita parziale. ✅ **Tutto sistemato** con la [PR #113](https://github.com/wrld777/apex-trading-journal/pull/113), tranne la lingua (vedi in fondo).

**Rotture visive**
- [x] Heatmap (Dashboard) e calendario mensile (Analytics): celle `aspect-square` in una griglia stirata a tutta larghezza → quadrati da ~90px e ~170px su desktop. Risolto con un tetto per colonna (`minmax(0, Npx)`) invece di `1fr`.
- [x] `DayOfWeekChart` non aveva un asse zero: i giorni in perdita crescevano verso l'alto come i positivi. Ora lo zero è una riga e il segno è la direzione in cui la barra cresce.
- ~~`CumulativePnLChart` sfora il riquadro~~ — **falso allarme, avevo letto male lo screenshot.** Riguardato: sta dentro il pannello. Nessuna modifica fatta.

**Bug di logica**
- [x] `verdict()` in `StrategyAnalytics.tsx` non aveva un ramo per "l'aderenza va *peggio*" e scriveva "Aderenza e risultati allineati". Aggiunto: *"Va meglio quando le salti → le regole non descrivono ciò che funziona"*.
- [x] `instrument` scartato in registrazione — superato: il campo è stato rimosso del tutto con la #110.

**Code della #106 rimaste indietro**
- [x] Strategy Insights confrontava le strategie in dollari: ora `ExpectancyR` in evidenza e i dollari sotto come riferimento. Sui dati di prova ICT fa `+1.12R` ma solo `+$89`, ORB `+0.72R` ma `+$546` — in R vince ICT, in dollari ORB. È esattamente il motivo per cui serve l'R.
- [x] Setup Performance: il colore ora segue l'R (il numero che si legge), e i dollari compaiono accanto **solo quando dissentono** dal segno dell'R.
- [x] `Avg RR` non ha più la "R" attaccata.
- [x] Colonna R in Trade Log e Recent Trades. Nel Trade Log si vede il punto: un trade perso mostra `R −1.00R` accanto a `RR 1.00`.

**Rifiniture**
- [x] Card della pagina Strategie: ora mostrano trade, win rate ed expectancy in R per trade.
- [x] `PAGE_META` completa: niente più "APEX" su Trade Log, Strategie, Insights e Profilo.
- [x] "Good morning" segue l'ora del giorno.
- 🚧 ~~**Italiano e inglese mescolati**~~ → [#114](https://github.com/wrld777/apex-trading-journal/issues/114), **in corso**.
  **Deciso: inglese ovunque, passando da un dizionario** (`src/i18n/`), così aggiungere l'italiano dopo è solo riempire un secondo file — e il tipo delle chiavi deriva dall'inglese, quindi una traduzione incompleta **non compila**.
  Deciso sui numeri, non a sensazione: ~139 stringhe italiane nel frontend, ma **79 messaggi d'errore del backend già in inglese** che finiscono dritti nei toast. L'italiano avrebbe richiesto di tradurre anche quelli, restando comunque ibridi sui termini del mestiere (Take Profit, Drawdown, Profit Factor non si traducono).
  Convertite: auth, sidebar, topbar, errori, profilo, strategie e modale, insights, log trade, trade log, dashboard, analytics, screenshot. **Manca:** le voci di menù della Sidebar (ancora `Strategie`) e una rilettura schermata per schermata.

---

## 🎨 Grafica / UX
_Cosa non ti convince dell'interfaccia. Anche solo "questa schermata mi stanca" va benissimo — serve capire il **cosa** prima di toccare il come._

- ~~non mi convince devo brandizzarlo Apex è un nome demo la grafica non mi piace posso progettarla su figma nel caso e passartela~~ → [#114](https://github.com/wrld777/apex-trading-journal/issues/114) (parte nome e lingua)
  **Nome deciso il 14/08: Apex → Rubric.** `Apex` collide con **Apex Trader Funding**, una delle prop firm più note: puntava esattamente al mondo dei conti funded che la #106 ha tolto dall'app. Una *rubric* è una griglia di criteri espliciti con cui si valuta una prestazione — cioè la checklist di regole per strategia.
  ⚠️ "Rubric" è già usato nel software da altre società (una startup di productivity, una di traduzioni). Nessuna nel trading, e i marchi valgono per classe, ma **il dominio `.com` non sarà disponibile**: serve una variante (`rubric.app`, `tryrubric.com`…). Da verificare prima di stampare qualsiasi cosa.
  Rebrand **solo in superficie** (titolo, logo, testi): namespace `Apex.*`, solution, repo e nome DB restano.
  🚧 **In corso** su `feature/AJ-114` (`860bcf5`), non ancora in PR.

- **La grafica vera e propria resta da fare.** Palette, densità, tipografia. Il segno grafico è il primo nodo: la favicon è un fulmine viola che non c'entra col logo dentro l'app (tre barre bianche). In attesa del Figma, oppure si parte dai principi.
- ~~Sui i grafici i tastini settimana mese day non funzionano in quasi tutti.~~ → [#108](https://github.com/wrld777/apex-trading-journal/issues/108)
  Diagnosi: non erano rotti, erano **decorativi** — `<button>` senza `onClick`, con `1W` evidenziato fisso. Solo sulla Dashboard: Analytics aveva già un range da/a funzionante e il toggle Settimana/Mese di StrategyAnalytics era cablato.
  ✅ **Implementato** — [PR #109](https://github.com/wrld777/apex-trading-journal/pull/109). Un solo selettore in testa alla pagina che filtra tutto; la heatmap resta fuori dal filtro perché promette "Last 13 Weeks"; distinti "nessun trade mai" e "nessun trade in questo periodo". Tolta anche la scritta `May 2025` inchiodata nella Topbar.
  Nel farlo sono emersi due difetti sul **profit factor**: era calcolato come `avgWin/avgLoss` invece che profitto lordo su perdita lorda (3.00 invece di 9.00 sui dati di prova), e senza perdite restituiva 0 facendo leggere "Negative edge" a un periodo chiuso al 100% di win. Sistemati entrambi.


---

## 🚀 Deploy su VM
_Note e vincoli sull'andare in produzione. Pre-requisiti già identificati il 30/07:_
- [ ] `docker-compose.yml` non rispecchia la realtà (dichiara postgres:16 con utente `apex`; qui gira un PostgreSQL 18 **nativo** con `postgres/postgres`, e Docker non è installato)
- [ ] JWT secret placeholder in chiaro e committato in `appsettings.json`
- [ ] Nessun reset password (`AuthController` ha solo `register`/`login`) → su VM sarebbe lockout definitivo
- [ ] `Microsoft.OpenApi` 2.4.1 — vulnerabilità nota NU1903 (severity alta)

-

---

## 💡 Idee / Feature nuove
_Cose che vorresti che l'app facesse e oggi non fa._

-

---

## ❓ Domande / Dubbi
_Roba da chiarire insieme: scelte tecniche, dubbi sul modello dati, "ma questo perché funziona così?"._

-

---

## 📦 Varie
_Tutto il resto._

-
