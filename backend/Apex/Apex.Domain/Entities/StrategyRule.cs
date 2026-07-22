namespace Apex.Domain.Entities;

public class StrategyRule
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Label { get; set; } = string.Empty;
    public int Order { get; set; }
    public bool Required { get; set; }


    public Guid StrategyId { get; set; }
    public Strategy Strategy { get; set; } = null!;
}
