using Apex.Domain.Enums;

namespace Apex.Domain.Entities;

// Una singola uscita dal trade (#96). Il trade si registra sempre già chiuso:
// nel caso normale c'è una sola riga, i parziali sono più righe la cui somma di
// Contracts deve coprire per intero Trade.Quantity.
public class TradeExit
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TradeId { get; set; }
    public Trade Trade { get; set; } = null!;

    public TradeOutcome Outcome { get; set; }
    // Sempre valorizzato: per gli esiti diversi da Manual lo deriva il servizio
    // dai livelli del trade, così resta leggibile senza ricalcoli a valle.
    public decimal Price { get; set; }
    public int Contracts { get; set; }
    public DateTime? Time { get; set; }
    public int Order { get; set; }
}
