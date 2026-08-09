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
    }
}
