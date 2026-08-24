using Apex.Domain.DTO;
using Apex.Domain.Enums;

namespace Apex.Domain.Responses;

public class TradeResponse
{
    public Guid Id { get; set; }
    public Guid InstrumentId { get; set; }
    public string Symbol { get; set; } = string.Empty;
    public Direction Direction { get; set; }
    public decimal EntryPrice { get; set; }
    public decimal StopLoss { get; set; }
    public decimal TakeProfit { get; set; }
    public decimal ExitPrice { get; set; }
    public int Quantity { get; set; }
    public decimal PnL { get; set; }
    public decimal RiskReward { get; set; }
    // Lo stesso PnL in unità di rischio (#106), con segno. null quando lo stop
    // coincide con l'entry e l'R non è definito.
    public decimal? RMultiple { get; set; }
    public DateTime EntryTime { get; set; }
    public DateTime? ExitTime { get; set; }
    public TradeStatus Status { get; set; }
    public string Session { get; set; } = string.Empty;
    public string Setup { get; set; } = string.Empty;
    public string HTFBias { get; set; } = string.Empty;
    public string Grade { get; set; } = string.Empty;
    public string Rationale { get; set; } = string.Empty;
    public string EmotionalState { get; set; } = string.Empty;
    public string Mistakes { get; set; } = string.Empty;
    public List<string> MistakeTags { get; set; } = new();
    public List<string> Tags { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public List<string> Screenshots { get; set; } = new();
    public Guid? StrategyId { get; set; }
    // In sola lettura dalla navigation: la pagina di dettaglio mostra il nome,
    // non l'id.
    public string? StrategyName { get; set; }
    public List<TradeRuleCheckDto> RuleChecks { get; set; } = new();
    // Come si è usciti (#96): una riga nel caso normale, più righe sui parziali.
    public List<TradeExitDto> Exits { get; set; } = new();
}