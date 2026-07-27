using Apex.Domain.Common;
using Apex.Domain.DTOs;
using System;
using System.Collections.Generic;
using System.Text;

namespace Apex.Domain.Contracts
{
    public interface IStatsService
    {
        Task<Result<StatsDto>> GetStatsByUserAsync(Guid userId, CancellationToken ct);
        Task<Result<StatsDto>> GetStatsByDateRangeAsync(Guid userId, DateTime from, DateTime to, CancellationToken ct);
        Task<Result<StatsDto>> GetStatsByStrategyAsync(Guid userId, Guid strategyId, CancellationToken ct);

    }
}
