using Apex.Domain.Entities;

namespace Apex.Domain.Repositories;

public interface ITradeRepository
{
    Task<IEnumerable<Trade>> GetAllAsync(Guid userId, CancellationToken ct);
    Task<Trade> GetByIdAsync(Guid id, CancellationToken ct);
    Task<Trade> CreateAsync(Trade trade);
    Task<Trade> UpdateAsync(Trade trade);
    Task DeleteAsync(Trade trade);
}