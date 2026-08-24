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
        Task<Result<List<MistakeImpactDto>>> GetMistakeImpactAsync(Guid userId, CancellationToken ct);
        Task<Result<TiltDto>> GetTiltAsync(Guid userId, CancellationToken ct);
        Task<Result<SequenceDto>> GetSequenceAsync(Guid userId, CancellationToken ct);
        Task<Result<RiskConsistencyDto>> GetRiskConsistencyAsync(Guid userId, CancellationToken ct);
        Task<Result<WeeklyReviewDto>> GetWeeklyReviewAsync(Guid userId, DateTime? weekStart, CancellationToken ct);
    }
}
