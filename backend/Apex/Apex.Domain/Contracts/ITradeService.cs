using Apex.Domain.Common;
using Apex.Domain.DTOs;
using Apex.Domain.Request.Trade;

namespace Apex.Domain.Contracts;

public interface ITradeService
{
    Task<Result<PagedList<TradeDto>>> GetPagedAsync(Guid userId, TradeQuery query, CancellationToken cancellationToken = default);
    Task<Result<TradeDto>> GetByIdAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
    Task<Result<TradeDto>> CreateAsync(TradeDto dto, Guid userId, CancellationToken cancellationToken = default);
    Task<Result<TradeDto>> UpdateAsync(Guid id, TradeDto dto, Guid userId, CancellationToken cancellationToken = default);
    Task<Result<bool>> DeleteAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
}