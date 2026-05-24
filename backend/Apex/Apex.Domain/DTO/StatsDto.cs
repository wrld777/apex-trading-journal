namespace Apex.Domain.DTOs;

public class StatsDto
{
    public decimal NetPnL { get; set; }
    public decimal WinRate { get; set; }
    public decimal AvgRR { get; set; }
    public decimal ProfitFactor { get; set; }
    public decimal MaxDrawdown { get; set; }
    public double AvgHoldMinutes { get; set; }
    public int TotalTrades { get; set; }
    public int WinCount { get; set; }
    public int LossCount { get; set; }
    public int BreakEvenCount { get; set; }
    public decimal BestTrade { get; set; }
    public decimal WorstTrade { get; set; }
    public decimal AvgWin { get; set; }
    public decimal AvgLoss { get; set; }
    public int BestStreak { get; set; }
    public int WorstStreak { get; set; }
    public List<SessionStatsDto> SessionStats { get; set; } = new();
    public List<SetupStatsDto> SetupStats { get; set; } = new();
    public List<DayOfWeekStatsDto> DayOfWeekStats { get; set; } = new();
    public List<DailyPnLDto> DailyPnL { get; set; } = new();
}

public class SessionStatsDto
{
    public string Session { get; set; } = string.Empty;
    public decimal PnL { get; set; }
    public int TotalTrades { get; set; }
    public decimal WinRate { get; set; }
}

public class SetupStatsDto
{
    public string Setup { get; set; } = string.Empty;
    public decimal PnL { get; set; }
    public int TotalTrades { get; set; }
    public decimal WinRate { get; set; }
}

public class DayOfWeekStatsDto
{
    public string Day { get; set; } = string.Empty;
    public decimal PnL { get; set; }
    public int TotalTrades { get; set; }
}

public class DailyPnLDto
{
    public DateTime Date { get; set; }
    public decimal PnL { get; set; }
    public int TotalTrades { get; set; }
}