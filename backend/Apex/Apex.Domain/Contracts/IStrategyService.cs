using Apex.Domain.Common;
using Apex.Domain.DTOs;

namespace Apex.Domain.Contracts;

public interface IStrategyService
{
    Task<Result<List<StrategyDto>>> GetAllAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<Result<StrategyDto>> GetByIdAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
    Task<Result<StrategyDto>> CreateAsync(StrategyDto dto, Guid userId, CancellationToken cancellationToken = default);
    Task<Result<StrategyDto>> UpdateAsync(Guid id, StrategyDto dto, Guid userId, CancellationToken cancellationToken = default);
    Task<Result<bool>> DeleteAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
}
