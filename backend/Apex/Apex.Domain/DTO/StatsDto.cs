namespace Apex.Domain.DTOs;

public class StatsDto
{
    public decimal NetPnL { get; set; }
    // Gli stessi risultati in unità di rischio (#106): è il metro con cui si giudica
    // la strategia, i dollari restano come riferimento. I trade con rischio 0
    // (stop sull'entry) non hanno un R definito e restano fuori dalle medie in R:
    // RTradeCount dice su quanti trade sono calcolate.
    public decimal NetR { get; set; }
    public decimal ExpectancyR { get; set; }
    // Quanto quell'expectancy può discostarsi da quella vera, dato quanti trade
    // la sostengono: con un campione piccolo il numero è un intervallo, non un
    // risultato, e mostrarlo nudo invita a concludere dal rumore.
    public decimal ExpectancyRStdErr { get; set; }
    public decimal MaxDrawdownR { get; set; }
    public int RTradeCount { get; set; }
    public decimal WinRate { get; set; }
    public decimal AvgRR { get; set; }
    // null quando non ci sono trade in perdita: il rapporto non è definito.
    public decimal? ProfitFactor { get; set; }
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
    public decimal R { get; set; }
    public int TotalTrades { get; set; }
    public decimal WinRate { get; set; }
}

public class SetupStatsDto
{
    public string Setup { get; set; } = string.Empty;
    public decimal PnL { get; set; }
    public decimal R { get; set; }
    public int TotalTrades { get; set; }
    public decimal WinRate { get; set; }
}

public class DayOfWeekStatsDto
{
    public string Day { get; set; } = string.Empty;
    public decimal PnL { get; set; }
    public decimal R { get; set; }
    public int TotalTrades { get; set; }
}

public class DailyPnLDto
{
    public DateTime Date { get; set; }
    public decimal PnL { get; set; }
    public decimal R { get; set; }
    public int TotalTrades { get; set; }
}