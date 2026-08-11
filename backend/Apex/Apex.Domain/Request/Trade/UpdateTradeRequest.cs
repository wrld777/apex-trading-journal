using Apex.Domain.DTO;
using Apex.Domain.Enums;

namespace Apex.Domain.Requests;

public class UpdateTradeRequest
{
    public decimal ExitPrice { get; set; }
    // Come in create: esito singolo oppure lista di parziali (#96).
    public TradeOutcome? Outcome { get; set; }
    public List<TradeExitDto> Exits { get; set; } = new();
    public DateTime? ExitTime { get; set; }
    public string Rationale { get; set; } = string.Empty;
    public string EmotionalState { get; set; } = string.Empty;
    public string Mistakes { get; set; } = string.Empty;
    public List<string> Tags { get; set; } = new();
    public List<string> Screenshots { get; set; } = new();
    public Guid? StrategyId { get; set; }
    public List<TradeRuleCheckDto> RuleChecks { get; set; } = new();
}