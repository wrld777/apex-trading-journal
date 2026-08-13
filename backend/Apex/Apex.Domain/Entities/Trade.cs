using System.ComponentModel.DataAnnotations.Schema;
using Apex.Domain.Enums;

namespace Apex.Domain.Entities;

public class Trade
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid InstrumentId { get; set; }
    public Instrument Instrument { get; set; } = null!;
    public Direction Direction { get; set; }
    public decimal EntryPrice { get; set; }
    public decimal StopLoss { get; set; }
    public decimal TakeProfit { get; set; }
    // Derivato dalle uscite (#96): media dei prezzi pesata sui contratti. Resta sul
    // trade perché stats, analytics ed export ci si appoggiano, ma non si scrive più
    // a mano.
    public decimal ExitPrice { get; set; }
    public int Quantity { get; set; }
    public decimal PnL { get; set; }
    public decimal RiskReward { get; set; }
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
    public List<string> Screenshots { get; set; } = new();
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public Guid? StrategyId { get; set; }
    public Strategy? Strategy { get; set; }
    public List<TradeRuleCheck> RuleChecks { get; set; } = new();
    public List<TradeExit> Exits { get; set; } = new();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Rischio iniziale in valuta (#106): quanto sarebbe costato lo stop a piena size.
    // Usa lo stesso PointValue del PnL, altrimenti i due numeri non sarebbero
    // confrontabili. Richiede Instrument caricato — tutte le query che alimentano
    // stats e analytics lo fanno con Include.
    [NotMapped]
    public decimal InitialRisk =>
        Math.Abs(EntryPrice - StopLoss) * Quantity * (Instrument?.PointValue ?? 0m);

    // PnL espresso in unità di rischio, **con segno**: è la misura di efficienza
    // indipendente dal capitale che sostituisce le "% of capital".
    // Da non confondere con RiskReward, che è una magnitudine senza segno.
    // null — non zero — quando lo stop coincide con l'entry: lì l'R non è definito.
    [NotMapped]
    public decimal? RMultiple =>
        InitialRisk > 0 ? Math.Round(PnL / InitialRisk, 2) : null;
}