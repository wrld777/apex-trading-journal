# ADR 0001 — Storage degli screenshot su disco locale

tags: #decision #adr #backend #storage #screenshot

**Stato:** ♻️ **Superata da** [[0002 - Screenshot come URL incollato dall'utente]]
**Data:** 2026-06-29 · **Ambito:** BE · Storage · **Issue:** [#76](https://github.com/wrld777/apex-trading-journal/issues/76)

> ♻️ **Decisione superata.** Non implementeremo (per ora) l'upload su disco: l'utente **incolla un URL** di immagine e lo salviamo come stringa. Vedi [[0002 - Screenshot come URL incollato dall'utente]]. Questa nota resta per storia e perché l'upload su disco è il naturale **passo 2** (ibrido).

---

## Contesto
Per la issue #76 vogliamo permettere il caricamento di **screenshot dei grafici** associati a un trade.
- L'entità `Trade` ha già `List<string> Screenshots` (vedi [[../02 - Database/Schema#TRADES]]) e `TradeErrors` prevede già limiti (`ScreenshotLimitReached` = max 5, `ScreenshotTooLarge` = 10MB, `InvalidScreenshotFormat` = PNG/JPG/WebP).
- Manca il wiring end-to-end: dove **fisicamente** finiscono i file?
- Vincoli attuali: progetto in **fase dev**, single-instance, niente budget cloud, priorità alla semplicità.

## Opzioni considerate
1. **Disco locale** (`wwwroot/uploads/...`), il DB salva il path
   - ✅ Semplicissimo, zero dipendenze/costo, facile da debuggare
   - ⚠️ Non scala su più istanze, backup manuale, i file non vanno versionati
2. **Object storage cloud** (Cloudflare R2 / S3 / Supabase Storage)
   - ✅ Durevole, scala, pronto per produzione multi-istanza
   - ⚠️ Setup, credenziali, costo, SDK aggiuntivo — troppo per ora
3. **BLOB dentro PostgreSQL**
   - ✅ Transazionale, un solo backup
   - ⚠️ Gonfia il DB, performance peggiori, anti-pattern per file binari

## Decisione
**Opzione 1 — disco locale.** I file vengono salvati in `wwwroot/uploads/{userId}/{tradeId}/{guid}.{ext}` e serviti come **static files**; il DB (`Trade.Screenshots`) conserva solo il **path/URL relativo**.
Motivo: massima semplicità, allineata allo stato dev del progetto; lo schema (path nel DB) ci permette di **migrare a object storage** in futuro cambiando solo il layer di storage, non il modello dati.

## Conseguenze
- ✅ Implementazione rapida (un endpoint upload + uno delete + `UseStaticFiles`).
- ⚠️ Aggiungere `backend/**/wwwroot/uploads/` al `.gitignore` (i file utente non si versionano).
- ⚠️ Validazione lato server obbligatoria: estensione, content-type, dimensione (riusare gli errori già in `TradeErrors`).
- 🔁 **Da rivedere quando:** deploy **multi-istanza o serverless**, oppure quando serve durabilità/backup automatici → migrare a R2/S3. Coerente con [[../05 - Deploy/Infrastructure]] dove "File Storage (screenshot) → Cloudflare R2 / S3" è già segnato come *da implementare*.

---

## Come si implementa
Guida pratica passo-passo (BE): [[../08 - Learnings/File upload in ASP.NET Core (IFormFile)]].

## Link Correlati
- [[Decisions]] — registro decisioni
- [[../01 - Architecture/Components#1.1 Controllers Apex.APIControllers]] — dove vive l'endpoint
- [[../02 - Database/Schema#TRADES]] — campo `Screenshots`
- [[../05 - Deploy/Infrastructure]] — piano storage produzione
- [[../06 - Roadmap/Current Sprint]] — Sprint 3 / #76
