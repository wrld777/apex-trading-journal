using Apex.Domain.Common;
using Apex.Domain.Contracts;
using Apex.Domain.DTO;
using Apex.Domain.Entities;
using Apex.Domain.Enums;
using Apex.Domain.Repositories;
using System;
using System.Collections.Generic;
using System.Text;

namespace Apex.Domain.Services
{
    public class AnalyticsService : IAnalyticsService
    {
        private readonly ITradeRepository _tradeRepository;
        private readonly IStrategyRepository _strategyRepository;

        public AnalyticsService(ITradeRepository tradeRepository, IStrategyRepository strategyRepository)
        {
            _tradeRepository = tradeRepository;
            _strategyRepository = strategyRepository;
        }



        public async Task<Result<List<StrategyStatsDto>>> GetStrategyStatsAsync(Guid userId, CancellationToken ct)
        {
            var trades = await _tradeRepository.GetForAnalyticsAsync(userId, null, null, null, ct);
            var result = trades
                .Where(t => t.StrategyId.HasValue)          
                .GroupBy(t => new { t.StrategyId, Name = t.Strategy!.Name })
                .Select(g =>
                {
                    var all = g.ToList();
                    var adherent = all.Where(IsFullyAdherent).ToList();
                    var notAdherent = all.Where(t => !IsFullyAdherent(t)).ToList();

                    return new StrategyStatsDto
                    {
                        StrategyId = g.Key.StrategyId!.Value,
                        StrategyName = g.Key.Name,
                        Overall = Metrics(all),
                        WhenFullyAdherent = Metrics(adherent),
                        WhenNotAdherent = Metrics(notAdherent)
                    };
                })
                .ToList();

            return Result<List<StrategyStatsDto>>.Success(result);
        }

        // Vista 3 — impatto della singola regola sul win rate (rispettata vs violata).
        public async Task<Result<List<RuleImpactDto>>> GetRuleImpactAsync(Guid userId, Guid strategyId, CancellationToken ct)
        {
            // ownership: GetByIdAsync filtra per userId, torna null se non è dell'utente.
            var strategy = await _strategyRepository.GetByIdAsync(strategyId, userId, ct);
            if (strategy is null)
                return Result<List<RuleImpactDto>>.Failure(
                    Error.FromStrategyError(StrategyErrors.NotFound(strategyId)));

            var trades = await _tradeRepository.GetForAnalyticsAsync(userId, strategyId, null, null, ct);

            // srotolo i trade nelle singole spunte, portandomi dietro l'esito del trade.
            var flat = trades.SelectMany(t => t.RuleChecks.Select(c => new
            {
                c.StrategyRuleId,
                c.StrategyRule.Label,
                c.Checked,
                IsWin = t.Status == TradeStatus.Win
            }));

            var result = flat
                .GroupBy(x => new { x.StrategyRuleId, x.Label })
                .Select(g =>
                {
                    var respected = g.Where(x => x.Checked).ToList();
                    var violated = g.Where(x => !x.Checked).ToList();
                    var wrResp = WinRate(respected.Count, respected.Count(x => x.IsWin));
                    var wrViol = WinRate(violated.Count, violated.Count(x => x.IsWin));

                    return new RuleImpactDto
                    {
                        StrategyRuleId = g.Key.StrategyRuleId,
                        Label = g.Key.Label,
                        TimesRespected = respected.Count,
                        TimesViolated = violated.Count,
                        WinRateRespected = wrResp,
                        WinRateViolated = wrViol,
                        Impact = wrResp - wrViol
                    };
                })
                .OrderByDescending(r => r.Impact)   // le più dannose se saltate in cima
                .ToList();

            return Result<List<RuleImpactDto>>.Success(result);
        }

        // Vista 4 — trend disciplina: media % di spunte per settimana/mese.
        public async Task<Result<List<DisciplinePointDto>>> GetDisciplineAsync(Guid userId, string granularity, CancellationToken ct)
        {
            var trades = await _tradeRepository.GetForAnalyticsAsync(userId, null, null, null, ct);

            var result = trades
                .Where(t => t.RuleChecks.Any())
                .GroupBy(t => PeriodStart(t.EntryTime, granularity))
                .Select(g => new DisciplinePointDto
                {
                    PeriodStart = g.Key,
                    AdherenceRate = Math.Round(
                        g.Average(t => (decimal)t.RuleChecks.Count(c => c.Checked) / t.RuleChecks.Count) * 100, 2),
                    TotalTrades = g.Count()
                })
                .OrderBy(p => p.PeriodStart)
                .ToList();

            return Result<List<DisciplinePointDto>>.Success(result);
        }

        // Vista 5 — mese per mese, per tutte le strategie o per una sola.
        // Il "come sta andando" non si legge dal cumulativo: un mese storto dentro
        // una curva che sale non si vede, e con una strategia sola il grafico
        // generale non c'entra nulla.
        public async Task<Result<List<MonthlyPerformanceDto>>> GetMonthlyAsync(Guid userId, Guid? strategyId, CancellationToken ct)
        {
            if (strategyId.HasValue)
            {
                // Stessa ownership del resto (#68): una strategia altrui non esiste.
                var strategy = await _strategyRepository.GetByIdAsync(strategyId.Value, userId, ct);
                if (strategy is null)
                    return Result<List<MonthlyPerformanceDto>>.Failure(
                        Error.FromStrategyError(StrategyErrors.NotFound(strategyId.Value)));
            }

            var trades = await _tradeRepository.GetForAnalyticsAsync(userId, strategyId, null, null, ct);

            var result = trades
                .GroupBy(t => new DateTime(t.EntryTime.Year, t.EntryTime.Month, 1, 0, 0, 0, DateTimeKind.Utc))
                .Select(g => new MonthlyPerformanceDto
                {
                    Month = g.Key,
                    NetPnL = Math.Round(g.Sum(t => t.PnL), 2),
                    Metrics = Metrics(g.ToList())
                })
                .OrderBy(m => m.Month)
                .ToList();

            return Result<List<MonthlyPerformanceDto>>.Success(result);
        }

        private static bool IsFullyAdherent(Trade t) =>
        t.RuleChecks.Any() && t.RuleChecks.All(c => c.Checked);

        private static decimal WinRate(int total, int wins) =>
            total > 0 ? Math.Round((decimal)wins / total * 100, 2) : 0;

        private static MetricsBlockDto Metrics(List<Trade> trades)
        {
            // I trade senza R definito (stop sull'entry) restano fuori dalle medie in R
            // ma continuano a contare in dollari.
            var withR = trades.Where(t => t.RMultiple.HasValue).ToList();
            var netR = withR.Sum(t => t.RMultiple!.Value);

            return new MetricsBlockDto
            {
                TotalTrades = trades.Count,
                WinRate = WinRate(trades.Count, trades.Count(t => t.Status == TradeStatus.Win)),
                Expectancy = trades.Count > 0 ? Math.Round(trades.Average(t => t.PnL), 2) : 0,
                ExpectancyR = withR.Count > 0 ? Math.Round(netR / withR.Count, 2) : 0,
                NetR = Math.Round(netR, 2),
                AvgRR = trades.Count > 0 ? Math.Round(trades.Average(t => t.RiskReward), 2) : 0
            };
        }

        private static DateTime PeriodStart(DateTime d, string granularity) =>
            granularity == "month"
                ? new DateTime(d.Year, d.Month, 1, 0, 0, 0, DateTimeKind.Utc)
                : d.Date.AddDays(-(int)d.DayOfWeek);   
    }
}
