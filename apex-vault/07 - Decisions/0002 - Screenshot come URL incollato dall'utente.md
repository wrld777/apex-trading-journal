# ADR 0002 — Screenshot come URL incollato dall'utente

tags: #decision #adr #backend #frontend #storage #screenshot

**Stato:** ✅ Accettata
**Data:** 2026-06-29 · **Ambito:** BE+FE · Storage · **Issue:** [#76](https://github.com/wrld777/apex-trading-journal/issues/76)
**Supera:** [[0001 - Storage screenshot su disco locale]]

---

## Contesto
Rivalutando la #76: la maggior parte degli screenshot di trading viene da **TradingView**, che con la funzione *snapshot* genera un **link a un'immagine** già ospitata da loro. Più in generale, basta che l'utente incolli un **URL che punta a un'immagine**.
- `Trade.Screenshots` è **già `List<string>`** (vedi [[../02 - Database/Schema#TRADES]]) → un URL ci sta dentro senza modifiche al modello.
- Questo elimina del tutto lo storage di file (il punto pesante dell'[[0001 - Storage screenshot su disco locale|ADR 0001]]).

## Decisione
L'utente **incolla un URL immagine**; il FE verifica che l'URL **renda davvero un'immagine** (caricandolo in un `<img>`: `onload` = ok, `onerror` = scarta) e ne mostra l'anteprima. Salviamo **solo la stringa URL** in `Trade.Screenshots`. Modificabile sia in **creazione** (LogTrade) sia in **modifica** (EditTradeModal).

## Conseguenze
- ✅ **Storage zero**: niente `wwwroot/uploads`, static files, gitignore.
- ✅ BE minimo: basta far transitare gli screenshot nei request DTO (vedi contratto sotto).
- ✅ Funziona subito con qualunque host immagine (TradingView, Imgur, ecc.).
- ⚠️ **Durabilità non nostra**: se l'host cancella l'immagine, il link muore.
- ⚠️ **Azione manuale**: l'utente fa lo snapshot e incolla il link (no cattura automatica).
- ⚠️ **Validazione**: accettare solo URL `http(s)` ben formati (lato server); il FE renderizza come `<img src>`.
- 🔁 **Da rivedere quando:** serve durabilità garantita o upload diretto di file → si aggiunge l'upload su disco/object storage **accanto** agli URL (il modello "lista di stringhe" già lo permette → [[0001 - Storage screenshot su disco locale]]).

---

## Contratto BE/FE (per non disallinearci)

**Backend** (piccolo):
1. Aggiungere `List<string> Screenshots` a `CreateTradeRequest` **e** `UpdateTradeRequest` (`Domain/Request/Trade`).
2. Verificare che `Screenshots` sia esposto in `TradeDto` **e** `TradeResponse` (per ri-leggerli nel FE).
3. `TradeService`: in `CreateAsync` arriva già dal mapping; in `UpdateAsync` aggiungere `trade.Screenshots = dto.Screenshots`.
4. *(facoltativo)* `CreateTradeRequestValidator`: ogni stringa = URL `http(s)` valido.

**Frontend** (il resto):
1. `types/trade.ts`: aggiungere `screenshots` a `TradeDto`, `CreateTradeRequest`, `UpdateTradeRequest`.
2. Input "incolla URL" + validazione via `<img>` + lista con anteprima/rimozione, in **LogTrade** e **EditTradeModal**.
3. Render delle immagini nel dettaglio trade.

---

## Link Correlati
- [[Decisions]] — registro
- [[0001 - Storage screenshot su disco locale]] — decisione superata (passo 2 ibrido)
- [[../02 - Database/Schema#TRADES]] — campo `Screenshots`
- [[../03 - API/Trade API]] — request DTO da estendere
- [[../01 - Architecture/Services/TradeService]] — mapping in create/update
