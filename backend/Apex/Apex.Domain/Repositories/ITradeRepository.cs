using Apex.Domain.Entities;

namespace Apex.Domain.Repositories;

public interface ITradeRepository
{
    Task<List<Trade>> GetAllAsync(Guid userId);
    Task<Trade?> GetByIdAsync(Guid id);
    Task<Trade> CreateAsync(Trade trade);
    Task<Trade> UpdateAsync(Trade trade);
    Task DeleteAsync(Guid id);
}