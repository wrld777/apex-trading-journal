using Apex.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Apex.Domain.Repositories
{
    public interface IStrategyRepository
    {
        Task<List<Strategy>> GetAllStrategiesAsync(Guid userId, CancellationToken ct);
        Task<Strategy?> GetByIdAsync(Guid id, Guid userId, CancellationToken ct);
        Task<Strategy?> GetByNameAsync(string name, Guid userId, CancellationToken ct);
        Task<Strategy> CreateAsync(Strategy strategy, CancellationToken ct);
        Task<Strategy> UpdateAsync(Strategy strategy, CancellationToken ct);
        Task DeleteAsync(Strategy strategy, CancellationToken ct);
    }
}
