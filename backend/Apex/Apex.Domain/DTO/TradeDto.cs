using Apex.Domain.DTO;
using Apex.Domain.Enums;

namespace Apex.Domain.DTOs;

public class TradeDto
{
    public Guid Id { get; set; }
    public Guid InstrumentId { get; set; }
    // Denormalizzato in sola lettura dal catalogo: il client sceglie per InstrumentId.
    public string Symbol { get; set; } = string.Empty;
    public Direction Direction { get; set; }
    public decimal EntryPrice { get; set; }
    public decimal StopLoss { get; set; }
    public decimal TakeProfit { get; set; }
    public decimal ExitPrice { get; set; }
    public int Quantity { get; set; }
    public decimal PnL { get; set; }
    public decimal RiskReward { get; set; }
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
    public List<string> Tags { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public List<string> Screenshots { get; set; } = new();
    public Guid? StrategyId { get; set; }
    // In sola lettura dalla navigation: la pagina di dettaglio mostra il nome,
    // non l'id.
    public string? StrategyName { get; set; }
    public List<TradeRuleCheckDto> RuleChecks { get; set; } = new();

    // Esito rapido (#96): con una sola uscita basta questo e il prezzo lo deriva
    // il servizio. Ignorato quando Exits è valorizzata.
    public TradeOutcome? Outcome { get; set; }
    public List<TradeExitDto> Exits { get; set; } = new();
}