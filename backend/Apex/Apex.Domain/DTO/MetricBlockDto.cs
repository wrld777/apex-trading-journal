using System;
using System.Collections.Generic;
using System.Text;

namespace Apex.Domain.DTO
{
    public class MetricsBlockDto
    {
        public int TotalTrades { get; set; }
        public decimal WinRate { get; set; }
        public decimal Expectancy { get; set; }
        public decimal AvgRR { get; set; }
    }

    public class StrategyStatsDto
    {
        public Guid StrategyId { get; set; }
        public string StrategyName { get; set; } = string.Empty;
        public MetricsBlockDto Overall { get; set; } = new();
        public MetricsBlockDto WhenFullyAdherent { get; set; } = new();
        public MetricsBlockDto WhenNotAdherent { get; set; } = new();
    }

    public class RuleImpactDto
    {
        public Guid StrategyRuleId { get; set; }
        public string Label { get; set; } = string.Empty;
        public int TimesRespected { get; set; }
        public int TimesViolated { get; set; }
        public decimal WinRateRespected { get; set; }
        public decimal WinRateViolated { get; set; }
        public decimal Impact { get; set; }
    }

    public class DisciplinePointDto
    {
        public DateTime PeriodStart { get; set; }
        public decimal AdherenceRate { get; set; }
        public int TotalTrades { get; set; }
    }
    
        
 }

