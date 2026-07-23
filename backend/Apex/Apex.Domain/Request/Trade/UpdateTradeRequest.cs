using Apex.Domain.DTO;

namespace Apex.Domain.Requests;

public class UpdateTradeRequest
{
    public decimal ExitPrice { get; set; }
    public DateTime? ExitTime { get; set; }
    public string Rationale { get; set; } = string.Empty;
    public string EmotionalState { get; set; } = string.Empty;
    public string Mistakes { get; set; } = string.Empty;
    public List<string> Tags { get; set; } = new();
    public List<string> Screenshots { get; set; } = new();
    public Guid StrategyId { get; set; }
    public List<TradeRuleCheckDto> RuleChecks { get; set; } = new();
}