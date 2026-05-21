using Apex.Domain.Common;
using Apex.Domain.DTOs;

namespace Apex.Domain.Contracts;

public interface ITradeService
{
    Task<Result<List<TradeDto>>> GetAllAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<Result<TradeDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Result<TradeDto>> CreateAsync(TradeDto dto, Guid userId, CancellationToken cancellationToken = default);
    Task<Result<TradeDto>> UpdateAsync(Guid id, TradeDto dto, CancellationToken cancellationToken = default);
    Task<Result<bool>> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}