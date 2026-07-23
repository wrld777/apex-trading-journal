using System;
using System.Collections.Generic;
using System.Text;

namespace Apex.Domain.Entities
{
    public class TradeRuleCheck
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid TradeId { get; set; }
        public Trade Trade { get; set; } = null!;
        public Guid StrategyRuleId { get; set; }
        public StrategyRule StrategyRule { get; set; } = null!;
        public bool Checked { get; set; }
    }
}
