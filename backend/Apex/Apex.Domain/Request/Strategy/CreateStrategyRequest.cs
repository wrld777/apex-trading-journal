namespace Apex.Domain.Requests;

public class CreateStrategyRequest
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<StrategyRuleRequest> Rules { get; set; } = new();
}

public class StrategyRuleRequest
{
    public string Label { get; set; } = string.Empty;
    public int Order { get; set; }
    public bool Required { get; set; }
}
