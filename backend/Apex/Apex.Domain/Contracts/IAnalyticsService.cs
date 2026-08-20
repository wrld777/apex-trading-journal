using Apex.Domain.Common;
using Apex.Domain.DTO;
using System;
using System.Collections.Generic;
using System.Text;

namespace Apex.Domain.Contracts
{
    public interface IAnalyticsService
    {
        Task<Result<List<StrategyStatsDto>>> GetStrategyStatsAsync(Guid userId, CancellationToken ct);
        Task<Result<List<RuleImpactDto>>> GetRuleImpactAsync(Guid userId, Guid strategyId, CancellationToken ct);
        Task<Result<List<DisciplinePointDto>>> GetDisciplineAsync(Guid userId, string granularity, CancellationToken ct);
        Task<Result<List<MonthlyPerformanceDto>>> GetMonthlyAsync(Guid userId, Guid? strategyId, CancellationToken ct);
    }
}
