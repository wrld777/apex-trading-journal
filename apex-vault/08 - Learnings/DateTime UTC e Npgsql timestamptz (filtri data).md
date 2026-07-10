# DateTime UTC e Npgsql timestamptz (filtri data)

tags: #learning #skill #backend #postgres #datetime

**Data:** 2026-07-10 · **Contesto:** [#77](https://github.com/wrld777/apex-trading-journal/issues/77) BE · **Area:** BE
**Decisione collegata:** —

---

## In una riga
Le colonne `timestamp with time zone` di Postgres accettano solo `DateTime` con **`Kind = Utc`**. Un valore con `Kind = Unspecified` (tipico di una data senza fuso, es. `?from=2026-04-01` dal binding query) fa **crashare la query con 500** — va normalizzato con `DateTime.SpecifyKind(x, DateTimeKind.Utc)` prima di passarlo a EF.

## Come si fa
Il model binder, su una data senza fuso, produce `Kind = Unspecified`. Npgsql lo rifiuta. Si etichetta il valore come UTC prima del `Where`:
```csharp
// TradeRepository.GetPagedAsync
if (q.From is not null)
{
    var from = DateTime.SpecifyKind(q.From.Value, DateTimeKind.Utc);
    query = query.Where(t => t.EntryTime >= from);
}
if (q.To is not null)
{
    var to = DateTime.SpecifyKind(q.To.Value, DateTimeKind.Utc);
    query = query.Where(t => t.EntryTime <= to);
}
```
`SpecifyKind` **non sposta l'orario**: cambia solo l'etichetta del fuso da "sconosciuto" a "UTC".

## Trappole / cose che mi hanno bloccato
- ⚠️ **Ci è già capitato** al create (`entryTime` doveva avere il suffisso `Z`) — vedi nota in [[../06 - Roadmap/Current Sprint#🧪 Dati di test (dev DB)]]. In #77 è tornato dal lato **filtro**: `?from=2026-04-01` (data secca, formato più naturale che manda il FE) → `Kind=Unspecified` → 500. `?from=2026-04-01T00:00:00Z` invece funziona già.
- ⚠️ Errore preciso: *"Cannot write DateTime with Kind=Unspecified to PostgreSQL type 'timestamp with time zone', only UTC is supported."*
- ⚠️ **Non** usare `SpecifyKind` dentro l'espressione `Where(t => ... SpecifyKind(...))`: EF prova a tradurlo in SQL. Normalizza in una **variabile locale** prima, poi confronta.
- ⚠️ Attento al bound `to` inclusivo: `<= 2026-06-15 00:00Z` **esclude** i trade dopo la mezzanotte di quel giorno. Il FE manda `to` **+1 giorno** per includere l'intera giornata (vedi [[../04 - Frontend/Hooks & Services]]).

## Quando lo riuso
Ogni filtro/scrittura di date verso Postgres `timestamptz` in questo progetto: normalizza sempre a UTC al confine (binding → repository). Vale per qualsiasi nuovo endpoint con range di date.

---

## Link Correlati
- [[Learnings]]
- [[../03 - API/Trade API]] — `GET /api/trade` con filtri `from`/`to`
- [[../06 - Roadmap/Current Sprint]] — #77
