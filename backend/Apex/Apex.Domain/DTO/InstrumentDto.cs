using Apex.Domain.Enums;

namespace Apex.Domain.DTOs;

public class InstrumentDto
{
    public Guid InstrumentId { get; set; }
    public string Symbol { get; set; } = string.Empty;
    public string InstrumentName { get; set; } = string.Empty;
    public decimal PointValue { get; set; }
    public decimal TickSize { get; set; }
    public decimal TickValue { get; set; }
    public string Currency { get; set; } = string.Empty;
    public InstrumentType Type { get; set; }
}
