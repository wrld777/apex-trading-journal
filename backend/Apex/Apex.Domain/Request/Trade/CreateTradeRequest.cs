using Apex.Domain.DTO;
using Apex.Domain.Enums;

namespace Apex.Domain.Requests;

public class CreateTradeRequest
{
    public Guid InstrumentId { get; set; }
    public Direction Direction { get; set; }
    public decimal EntryPrice { get; set; }
    public decimal StopLoss { get; set; }
    public decimal TakeProfit { get; set; }
    public decimal ExitPrice { get; set; }
    public int Quantity { get; set; }
    public DateTime EntryTime { get; set; }
    public DateTime? ExitTime { get; set; }
    public string Session { get; set; } = string.Empty;
    public string Setup { get; set; } = string.Empty;
    public string HTFBias { get; set; } = string.Empty;
    public string Grade { get; set; } = string.Empty;
    public string Rationale { get; set; } = string.Empty;
    public string EmotionalState { get; set; } = string.Empty;
    public string Mistakes { get; set; } = string.Empty;
    public List<string> Tags { get; set; } = new();
    public List<string> Screenshots { get; set; } = new();
    public Guid? StrategyId { get; set; }
    public List<TradeRuleCheckDto> RuleChecks { get; set; } = new();

    // #96 — due modi di chiudere il trade:
    // - Outcome da solo: uscita unica su tutta la quantità, prezzo derivato.
    // - Exits: uscite parziali, la somma dei Contracts deve coprire Quantity.
    // ExitPrice resta solo come prezzo dell'uscita manuale nel caso semplice.
    public TradeOutcome? Outcome { get; set; }
    public List<TradeExitDto> Exits { get; set; } = new();
}