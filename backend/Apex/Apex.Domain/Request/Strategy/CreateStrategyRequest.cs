namespace Apex.Domain.Requests;

public class CreateStrategyRequest
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<StrategyRuleRequest> Rules { get; set; } = new();
    public List<Guid> InstrumentIds { get; set; } = new();
}

public class StrategyRuleRequest
{
    // Valorizzato solo in update, per le regole che esistono già: è ciò che permette
    // di aggiornarle sul posto invece di ricrearle. Una regola ricreata ha un Id nuovo
    // e l'aderenza registrata sui trade (TradeRuleCheck) resterebbe orfana.
    public Guid? Id { get; set; }
    public string Label { get; set; } = string.Empty;
    public int Order { get; set; }
    public bool Required { get; set; }
}
