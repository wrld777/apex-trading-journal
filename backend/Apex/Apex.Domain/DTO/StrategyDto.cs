namespace Apex.Domain.DTOs;

public class StrategyDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<StrategyRuleDto> Rules { get; set; } = new();
    // Solo gli id: il catalogo strumenti è un seed che il FE tiene già in cache (#94),
    // non serve rispedire simbolo e point value dentro ogni strategia.
    public List<Guid> InstrumentIds { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public class StrategyRuleDto
{
    public Guid Id { get; set; }
    public string Label { get; set; } = string.Empty;
    public int Order { get; set; }
    public bool Required { get; set; }
}
