using Apex.Domain.Common;
using Apex.Domain.DTOs;

namespace Apex.Domain.Contracts;

public interface IInstrumentService
{
    // Catalogo globale in sola lettura: nessuno scoping per utente.
    Task<Result<List<InstrumentDto>>> GetAllAsync(CancellationToken ct);
}
