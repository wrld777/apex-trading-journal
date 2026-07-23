using System;

namespace Apex.Domain.DTO
{
    public class TradeRuleCheckDto
    {
        public Guid StrategyRuleId { get; set; }
        public bool Checked { get; set; }
    }
}
