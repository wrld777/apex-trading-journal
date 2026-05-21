using Apex.Domain.Entities;

namespace Apex.Domain.Repositories;

public interface ITradeRepository
{
    Task<List<Trade>> GetAllAsync(Guid userId, CancellationToken ct);
    Task<Trade?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<Trade> CreateAsync(Trade trade, CancellationToken ct);
    Task<Trade> UpdateAsync(Trade trade, CancellationToken ct);
    Task DeleteAsync(Trade trade, CancellationToken ct);
}