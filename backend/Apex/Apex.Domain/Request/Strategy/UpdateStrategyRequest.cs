namespace Apex.Domain.Requests;

public class UpdateStrategyRequest
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<StrategyRuleRequest> Rules { get; set; } = new();
}
