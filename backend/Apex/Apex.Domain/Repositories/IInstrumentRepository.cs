using Apex.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Apex.Domain.Repositories
{
    public interface IInstrumentRepository
    {
        Task<Instrument?> GetInstrumentByIdAsync(Guid instrumentId, CancellationToken ct);

        Task<List<Instrument>> GetAllAsync(CancellationToken ct);

        // Tracked di proposito: le entità tornate qui vengono agganciate alla collection
        // di una Strategy per creare le righe di join, e con AsNoTracking EF le
        // considererebbe nuove e proverebbe a reinserirle nel catalogo (#95).
        Task<List<Instrument>> GetByIdsAsync(IReadOnlyCollection<Guid> instrumentIds, CancellationToken ct);
    }
}
