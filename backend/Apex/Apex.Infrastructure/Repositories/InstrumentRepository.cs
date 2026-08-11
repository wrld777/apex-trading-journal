using Apex.Domain.Entities;
using Apex.Domain.Repositories;
using Apex.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace Apex.Infrastructure.Repositories
{
    public class InstrumentRepository : IInstrumentRepository
    {
        private readonly AppDbContext _context;

        public InstrumentRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Instrument?> GetInstrumentByIdAsync(Guid instrumentId, CancellationToken ct)
        {
            return await _context.Instruments.FirstOrDefaultAsync(i => i.InstrumentId == instrumentId, ct);
        }

        public async Task<List<Instrument>> GetByIdsAsync(IReadOnlyCollection<Guid> instrumentIds, CancellationToken ct)
        {
            if (instrumentIds.Count == 0)
                return new List<Instrument>();

            return await _context.Instruments
                .Where(i => instrumentIds.Contains(i.InstrumentId))
                .ToListAsync(ct);
        }

        public async Task<List<Instrument>> GetAllAsync(CancellationToken ct)
        {
            return await _context.Instruments
                .AsNoTracking()
                .OrderBy(i => i.Symbol)
                .ToListAsync(ct);
        }
    }
}