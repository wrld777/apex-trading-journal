using Apex.Domain.Common;
using Apex.Domain.Contracts;
using Apex.Domain.DTOs;
using Apex.Domain.Enums;
using Apex.Domain.Repositories;

namespace Apex.Domain.Services;

public class StatsService : IStatsService
{
    private readonly ITradeRepository _tradeRepository;

    public StatsService(ITradeRepository tradeRepository)
    {
        _tradeRepository = tradeRepository;
    }

    public async Task<Result<StatsDto>> GetStatsByUserAsync(Guid userId, CancellationToken ct)
    {
        var trades = await _tradeRepository.GetAllAsync(userId, ct);
        if (!trades.Any())
            return Result<StatsDto>.Success(new StatsDto());

        return Result<StatsDto>.Success(CalculateStats(trades));
    }

    public async Task<Result<StatsDto>> GetStatsByDateRangeAsync(Guid userId, DateTime from, DateTime to, CancellationToken ct)
    {
        var trades = await _tradeRepository.GetByDateRangeAsync(userId, from, to, ct);
        if (!trades.Any())
            return Result<StatsDto>.Success(new StatsDto());

        return Result<StatsDto>.Success(CalculateStats(trades));
    }

    public async Task<Result<StatsDto>> GetStatsByStrategyAsync(Guid userId, Guid strategyId, CancellationToken ct)
    {
        var trades = await _tradeRepository.GetForAnalyticsAsync(userId, strategyId, null, null, ct);
        if (!trades.Any())
            return Result<StatsDto>.Success(new StatsDto());

        return Result<StatsDto>.Success(CalculateStats(trades));
    }

    private static StatsDto CalculateStats(List<Apex.Domain.Entities.Trade> trades)
    {
        var wins = trades.Where(t => t.Status == TradeStatus.Win).ToList();
        var losses = trades.Where(t => t.Status == TradeStatus.Loss).ToList();

        var netPnL = trades.Sum(t => t.PnL);
        var winCount = wins.Count;
        var lossCount = losses.Count;
        var totalTrades = trades.Count;
        var winRate = totalTrades > 0 ? Math.Round((decimal)winCount / totalTrades * 100, 2) : 0;
        var avgWin = winCount > 0 ? Math.Round(wins.Average(t => t.PnL), 2) : 0;
        var avgLoss = lossCount > 0 ? Math.Round(losses.Average(t => t.PnL), 2) : 0;
        var profitFactor = Math.Abs(avgLoss) > 0 ? Math.Round(avgWin / Math.Abs(avgLoss), 2) : 0;
        var avgRR = totalTrades > 0 ? Math.Round(trades.Average(t => t.RiskReward), 2) : 0;

        // Risultati in R (#106). I trade con stop sull'entry non hanno un R definito:
        // restano fuori dalle somme e dal conteggio, ma continuano a pesare in dollari.
        var rTrades = trades.Where(t => t.RMultiple.HasValue).ToList();
        var netR = rTrades.Sum(t => t.RMultiple!.Value);
        var expectancyR = rTrades.Count > 0 ? Math.Round(netR / rTrades.Count, 2) : 0;

        // Max Drawdown, in dollari e in R sulla stessa passata
        var maxDrawdown = 0m;
        var peak = 0m;
        var runningPnL = 0m;
        var maxDrawdownR = 0m;
        var peakR = 0m;
        var runningR = 0m;
        foreach (var trade in trades.OrderBy(t => t.EntryTime))
        {
            runningPnL += trade.PnL;
            if (runningPnL > peak) peak = runningPnL;
            var drawdown = peak - runningPnL;
            if (drawdown > maxDrawdown) maxDrawdown = drawdown;

            runningR += trade.RMultiple ?? 0m;
            if (runningR > peakR) peakR = runningR;
            var drawdownR = peakR - runningR;
            if (drawdownR > maxDrawdownR) maxDrawdownR = drawdownR;
        }

        // Streaks
        var bestStreak = 0;
        var worstStreak = 0;
        var curWin = 0;
        var curLoss = 0;
        foreach (var trade in trades.OrderBy(t => t.EntryTime))
        {
            if (trade.Status == TradeStatus.Win)
            {
                curWin++;
                curLoss = 0;
                if (curWin > bestStreak) bestStreak = curWin;
            }
            else if (trade.Status == TradeStatus.Loss)
            {
                curLoss++;
                curWin = 0;
                if (curLoss > worstStreak) worstStreak = curLoss;
            }
        }

        // Avg Hold
        var avgHold = trades
            .Where(t => t.ExitTime.HasValue)
            .Select(t => (t.ExitTime!.Value - t.EntryTime).TotalMinutes)
            .DefaultIfEmpty(0)
            .Average();

        // Session Stats
        var sessionStats = trades
            .GroupBy(t => t.Session)
            .Select(g => new SessionStatsDto
            {
                Session = g.Key,
                PnL = g.Sum(t => t.PnL),
                R = Math.Round(g.Sum(t => t.RMultiple ?? 0m), 2),
                TotalTrades = g.Count(),
                WinRate = Math.Round((decimal)g.Count(t => t.Status == TradeStatus.Win) / g.Count() * 100, 2)
            }).ToList();

        // Setup Stats
        var setupStats = trades
            .GroupBy(t => t.Setup)
            .Select(g => new SetupStatsDto
            {
                Setup = g.Key,
                PnL = g.Sum(t => t.PnL),
                R = Math.Round(g.Sum(t => t.RMultiple ?? 0m), 2),
                TotalTrades = g.Count(),
                WinRate = Math.Round((decimal)g.Count(t => t.Status == TradeStatus.Win) / g.Count() * 100, 2)
            }).ToList();

        // Day of Week Stats
        var dowStats = trades
            .GroupBy(t => t.EntryTime.DayOfWeek)
            .Select(g => new DayOfWeekStatsDto
            {
                Day = g.Key.ToString(),
                PnL = g.Sum(t => t.PnL),
                R = Math.Round(g.Sum(t => t.RMultiple ?? 0m), 2),
                TotalTrades = g.Count()
            }).ToList();

        // Daily PnL
        var dailyPnL = trades
            .GroupBy(t => t.EntryTime.Date)
            .Select(g => new DailyPnLDto
            {
                Date = g.Key,
                PnL = g.Sum(t => t.PnL),
                R = Math.Round(g.Sum(t => t.RMultiple ?? 0m), 2),
                TotalTrades = g.Count()
            })
            .OrderBy(d => d.Date)
            .ToList();

        return new StatsDto
        {
            NetPnL = Math.Round(netPnL, 2),
            NetR = Math.Round(netR, 2),
            ExpectancyR = expectancyR,
            MaxDrawdownR = Math.Round(maxDrawdownR, 2),
            RTradeCount = rTrades.Count,
            WinRate = winRate,
            AvgRR = avgRR,
            ProfitFactor = profitFactor,
            MaxDrawdown = Math.Round(maxDrawdown, 2),
            AvgHoldMinutes = Math.Round(avgHold, 1),
            TotalTrades = totalTrades,
            WinCount = winCount,
            LossCount = lossCount,
            BreakEvenCount = trades.Count(t => t.Status == TradeStatus.BreakEven),
            BestTrade = trades.Max(t => t.PnL),
            WorstTrade = trades.Min(t => t.PnL),
            AvgWin = avgWin,
            AvgLoss = avgLoss,
            BestStreak = bestStreak,
            WorstStreak = worstStreak,
            SessionStats = sessionStats,
            SetupStats = setupStats,
            DayOfWeekStats = dowStats,
            DailyPnL = dailyPnL
        };
    }
}