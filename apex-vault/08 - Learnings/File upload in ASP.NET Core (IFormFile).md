# File upload in ASP.NET Core (IFormFile)

tags: #learning #skill #backend #aspnetcore #screenshot

**Data:** 2026-06-29 · **Contesto:** [#76](https://github.com/wrld777/apex-trading-journal/issues/76) BE · **Area:** BE
**Decisione collegata:** [[../07 - Decisions/0001 - Storage screenshot su disco locale]]

> ℹ️ **Nota:** per la #76 abbiamo poi scelto gli **URL incollati** ([[../07 - Decisions/0002 - Screenshot come URL incollato dall'utente|ADR 0002]]), quindi questa tecnica **non** è usata ora. La nota resta come skill riutilizzabile (avatar, allegati, import) e come **passo 2 ibrido** della #76.

---

## In una riga
In ASP.NET Core un file caricato dal browser arriva come **`IFormFile`** dentro una request **`multipart/form-data`**; lo si valida, si scrive su disco con uno `Stream`, e si serve come **static file**. Il DB salva solo il **path**, non il file.

## Il concetto chiave
Il browser non manda JSON ma `multipart/form-data` (testo + binario insieme). Per questo:
- l'action usa **`[FromForm]`**, non `[FromBody]`;
- il parametro file è **`IFormFile`** (o `List<IFormFile>` per multipli);
- per servire i file al browser serve **`app.UseStaticFiles()`** (espone `wwwroot/`).

---

## Passi per la #76 (allineati alla nostra architettura)

### 1. Abilitare i file statici — `Program.cs`
```csharp
app.UseStaticFiles();           // serve wwwroot/ come URL pubblici
```
> Crea la cartella `Apex.API/wwwroot/uploads/` (anche solo con un `.gitkeep`).

### 2. Ignorare gli upload da git — `.gitignore`
```
backend/**/wwwroot/uploads/
```
(i file utente non si versionano — vedi [[../07 - Decisions/0001 - Storage screenshot su disco locale]])

### 3. Endpoint di upload — nel `TradeController`
Pattern userId-dal-token come gli altri endpoint (vedi [[../01 - Architecture/Components#1.1 Controllers Apex.APIControllers]]):
```csharp
// POST /api/trade/{id}/screenshots   (multipart/form-data, campo "file")
[Authorize]
[HttpPost("{id:guid}/screenshots")]
public async Task<IActionResult> UploadScreenshot(Guid id, [FromForm] IFormFile file, CancellationToken ct)
{
    var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    if (!Guid.TryParse(userIdClaim, out var userId))
        return Unauthorized();

    var result = await _tradeService.AddScreenshotAsync(id, userId, file, ct);
    if (!result.IsSuccess)
        return BadRequest(result.Error);

    return Ok(result.Value);   // TradeResponse aggiornato con il nuovo path
}
```

### 4. Validazione + salvataggio — nel service (`TradeService`)
La logica vive nel Domain, non nel controller. Riusa gli errori **già pronti** in `TradeErrors`:
```csharp
private static readonly string[] AllowedExt = { ".png", ".jpg", ".jpeg", ".webp" };
private const long MaxBytes = 10 * 1024 * 1024;   // 10MB
private const int  MaxShots = 5;

public async Task<Result<TradeDto>> AddScreenshotAsync(Guid id, Guid userId, IFormFile file, CancellationToken ct)
{
    var trade = await _tradeRepository.GetByIdAsync(id, ct);
    if (trade is null || trade.UserId != userId)                       // ownership (vedi #68)
        return Result<TradeDto>.Failure(Error.FromTradeError(TradeErrors.NotFound(id)));

    if (trade.Screenshots.Count >= MaxShots)
        return Result<TradeDto>.Failure(Error.FromTradeError(TradeErrors.ScreenshotLimitReached));
    if (file.Length == 0 || file.Length > MaxBytes)
        return Result<TradeDto>.Failure(Error.FromTradeError(TradeErrors.ScreenshotTooLarge));

    var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
    if (!AllowedExt.Contains(ext))
        return Result<TradeDto>.Failure(Error.FromTradeError(TradeErrors.InvalidScreenshotFormat));

    // path fisico: wwwroot/uploads/{userId}/{tradeId}/{guid}{ext}
    var relativeDir = Path.Combine("uploads", userId.ToString(), id.ToString());
    var absoluteDir = Path.Combine(_env.WebRootPath, relativeDir);     // IWebHostEnvironment
    Directory.CreateDirectory(absoluteDir);

    var fileName = $"{Guid.NewGuid()}{ext}";
    var absolutePath = Path.Combine(absoluteDir, fileName);
    await using (var stream = new FileStream(absolutePath, FileMode.Create))
        await file.CopyToAsync(stream, ct);                            // scrittura su disco

    // nel DB salviamo solo l'URL relativo, con '/' (web), non '\' (windows)
    var url = "/" + Path.Combine(relativeDir, fileName).Replace('\\', '/');
    trade.Screenshots.Add(url);

    var updated = await _tradeRepository.UpdateAsync(trade, ct);
    return Result<TradeDto>.Success(_mapper.Map<TradeDto>(updated));
}
```
> Per usare `_env.WebRootPath` inietta **`IWebHostEnvironment`** nel costruttore del service (registrato di default dal framework).

### 5. (Opzionale) Endpoint di delete
`DELETE /api/trade/{id}/screenshots?url=...` → verifica ownership, rimuove la stringa da `trade.Screenshots`, cancella il file con `File.Delete(absolutePath)`.

### 6. Provare con Swagger
Con `IFormFile` Swagger mostra un campo **file** da caricare. In alternativa `curl`:
```bash
curl -X POST https://localhost:7106/api/trade/<id>/screenshots \
  -H "Authorization: Bearer <token>" \
  -F "file=@chart.png"
```

---

## Trappole / cose da ricordare
- ⚠️ **`[FromForm]` non `[FromBody]`** — con `[FromBody]` il file arriva `null`.
- ⚠️ **Path separator**: su Windows `Path.Combine` usa `\`; per l'URL converti in `/`.
- ⚠️ **`UseStaticFiles()`** deve esserci o il file salvato non è raggiungibile via URL.
- ⚠️ **Sicurezza**: non fidarti di `file.FileName` (può contenere `../`). Genera tu il nome (`Guid`) e valida l'estensione — mai usare il nome originale come path.
- ⚠️ **Ownership**: controlla `trade.UserId == userId` anche qui (stesso motivo di [[../01 - Architecture/Services/TradeService|#68]]).
- ⚠️ **CORS/limiti**: upload grandi possono superare il limite di Kestrel/`MaxRequestBodySize`; per 10MB di default va bene.

## Quando lo riuso
Qualsiasi feature con upload (avatar profilo, allegati, import CSV). Lo schema "valida → salva su disco → path nel DB → static files" è sempre lo stesso; per la produzione si scambia il disco con object storage (R2/S3) senza toccare il modello dati.

---

## Link Correlati
- [[Learnings]]
- [[../07 - Decisions/0001 - Storage screenshot su disco locale]] — il *perché* dello storage su disco
- [[../03 - API/Trade API]] — dove aggiungere gli endpoint
- [[../01 - Architecture/Services/TradeService]] — dove va la logica
