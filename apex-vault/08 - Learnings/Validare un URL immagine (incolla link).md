# Validare un URL immagine (incolla link)

tags: #learning #skill #frontend #validation #screenshot

**Data:** 2026-06-29 · **Contesto:** [#76](https://github.com/wrld777/apex-trading-journal/issues/76) FE · **Area:** FE
**Decisione collegata:** [[../07 - Decisions/0002 - Screenshot come URL incollato dall'utente]]

---

## In una riga
Per accettare un link immagine incollato dall'utente la regola ha **due livelli**: (1) è un URL `http(s)` ben formato? (2) **rende davvero un'immagine?** Il secondo è quello che conta e si fa caricando l'URL in un `<img>`.

## Come si fa

### 1. Check sintattico — niente regex fragili
```ts
function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value.trim())
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}
```

### 2. Check semantico — l'URL è davvero un'immagine?
Non fidarsi dell'estensione (lo snapshot TradingView non finisce in `.png`): si prova a caricare in un `<img>`.
```ts
function isLoadableImage(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload  = () => resolve(img.naturalWidth > 0)  // immagine valida ✅
    img.onerror = () => resolve(false)                 // rotta / non immagine ❌
    img.src = url
  })
}
```

### 3. Regola completa (all'"Aggiungi")
```
url = input.trim()
!isHttpUrl(url)            → errore "URL non valido"
già presente              → errore "già aggiunto"
!await isLoadableImage    → errore "il link non mostra un'immagine"
altrimenti                → ok: anteprima + push nella lista
```
Implementato in `frontend/src/components/ui/ScreenshotInput.tsx` (riusato da LogTrade ed EditTradeModal).

## Trappole / cose da ricordare
- ⚠️ **TradingView**: il link snapshot `tradingview.com/x/<id>/` è una **pagina HTML**, non l'immagine → `onerror`. Serve il link diretto (tasto destro → "Copia indirizzo immagine"), URL tipo `s3.tradingview.com/snapshots/...`.
- ⚠️ Il check immagine è **asincrono** (onload/onerror): gestire uno stato `checking` per il bottone.
- ⚠️ Il **BE non può** sapere se è un'immagine senza scaricarla (rischio SSRF): valida solo il **formato URL** (`Uri.TryCreate` + scheme http/https). Vedi [[../03 - API/Trade API]].
- ⚠️ Render come `<img src>` è sicuro (no script), ma espone l'IP dell'utente all'host: ok per un journal personale.

## Quando lo riuso
Ogni volta che accetto un link a media da incollare (avatar, allegati, immagini). Lo schema "valida formato → verifica caricamento → preview" è generale.

---

## Link Correlati
- [[Learnings]]
- [[../07 - Decisions/0002 - Screenshot come URL incollato dall'utente]] — la decisione
- [[File upload in ASP.NET Core (IFormFile)]] — l'alternativa (upload file), non usata per #76
- [[../03 - API/Trade API]] — validazione lato BE
