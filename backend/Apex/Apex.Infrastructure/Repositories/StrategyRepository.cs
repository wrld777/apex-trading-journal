using Apex.Domain.Entities;
using Apex.Domain.Repositories;
using Apex.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace Apex.Infrastructure.Repositories
{
    public class StrategyRepository : IStrategyRepository
    {
        private readonly AppDbContext _context;

        public StrategyRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<Strategy>> GetAllStrategiesAsync(Guid userId, CancellationToken ct)
        {
            return await _context.Strategies
                .Where(s => s.UserId == userId)
                .Include(s => s.Rules.OrderBy(r => r.Order))
                .AsNoTracking()
                .ToListAsync(ct);
        }


        public async Task<Strategy?> GetByIdAsync(Guid id, Guid userId, CancellationToken ct)
        {
            return await _context.Strategies
                .Include(s => s.Rules.OrderBy(r => r.Order))
                .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId, ct);
        }

        public async Task<Strategy?> GetByNameAsync(string name, Guid userId, CancellationToken ct)
        {
            return await _context.Strategies
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.UserId == userId && s.Name == name, ct);
        }

        public async Task<Strategy> CreateAsync(Strategy strategy, CancellationToken ct)
        {
            strategy.CreatedAt = DateTime.UtcNow;
            strategy.UpdatedAt = DateTime.UtcNow;
            _context.Strategies.Add(strategy);
            await _context.SaveChangesAsync(ct);
            return strategy;
        }

        public async Task<Strategy> UpdateAsync(Strategy strategy, CancellationToken ct)
        {
            // L'entità è già tracciata (GetByIdAsync). Le regole vecchie sono state
            // rimosse dalla collection (→ Deleted via cascade); quelle nuove hanno un
            // Id fresco ma, aggiunte al grafo tracciato, EF le marca Modified e proverebbe
            // un UPDATE su righe inesistenti. Le forzo ad Added (in update è sempre replace).
            strategy.UpdatedAt = DateTime.UtcNow;

            foreach (var rule in strategy.Rules)
                _context.Entry(rule).State = EntityState.Added;

            await _context.SaveChangesAsync(ct);
            return strategy;
        }

        public async Task DeleteAsync(Strategy strategy, CancellationToken ct)
        {
            _context.Strategies.Remove(strategy);
            await _context.SaveChangesAsync(ct);
        }
    }
}
