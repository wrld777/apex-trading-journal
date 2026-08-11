using Apex.Domain.Enums;

namespace Apex.Domain.DTO;

// Una riga di uscita in ingresso/uscita dall'API (#96).
public class TradeExitDto
{
    public TradeOutcome Outcome { get; set; }
    // In ingresso serve solo con Outcome = Manual: negli altri casi il prezzo lo
    // deriva il servizio dai livelli del trade. In uscita è sempre valorizzato.
    public decimal? Price { get; set; }
    public int Contracts { get; set; }
    public DateTime? Time { get; set; }
    public int Order { get; set; }
}
