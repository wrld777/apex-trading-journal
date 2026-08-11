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
                .Include(s => s.Instruments)
                .AsNoTracking()
                .ToListAsync(ct);
        }


        public async Task<Strategy?> GetByIdAsync(Guid id, Guid userId, CancellationToken ct)
        {
            // Volutamente TRACKED: UpdateAsync lavora sul grafo caricato da qui
            // (replace di Rules e Instruments). Con AsNoTracking il Clear() non
            // produrrebbe alcuna DELETE e l'update salverebbe solo i campi scalari.
            return await _context.Strategies
                .Include(s => s.Rules.OrderBy(r => r.Order))
                .Include(s => s.Instruments)
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
            // L'entità arriva tracciata da GetByIdAsync e il service ha già fatto il
            // lavoro sul grafo: regole esistenti aggiornate sul posto, nuove aggiunte
            // con la chiave vuota (così EF le riconosce e le INSERTa), rimosse tolte
            // dalla collection. Qui non serve forzare nessuno stato — la vecchia
            // marcatura ad Added indiscriminata è ciò che rompeva le regole esistenti.
            //
            // Instruments non ha bisogno di niente: le entità arrivano già tracciate
            // come Unchanged dal catalogo, EF tocca solo le righe di join.
            strategy.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(ct);
            return strategy;
        }

        public async Task<HashSet<Guid>> GetRuleIdsInUseAsync(IReadOnlyCollection<Guid> ruleIds, CancellationToken ct)
        {
            if (ruleIds.Count == 0)
                return new HashSet<Guid>();

            var used = await _context.TradeRuleChecks
                .AsNoTracking()
                .Where(rc => ruleIds.Contains(rc.StrategyRuleId))
                .Select(rc => rc.StrategyRuleId)
                .Distinct()
                .ToListAsync(ct);

            return used.ToHashSet();
        }

        public async Task DeleteAsync(Strategy strategy, CancellationToken ct)
        {
            _context.Strategies.Remove(strategy);
            await _context.SaveChangesAsync(ct);
        }
    }
}
