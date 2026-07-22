namespace Apex.Domain.Responses;

public class StrategyResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<StrategyRuleResponse> Rules { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public class StrategyRuleResponse
{
    public Guid Id { get; set; }
    public string Label { get; set; } = string.Empty;
    public int Order { get; set; }
    public bool Required { get; set; }
}
