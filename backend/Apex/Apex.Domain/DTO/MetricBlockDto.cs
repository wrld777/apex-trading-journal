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
        // L'expectancy che conta per confrontare strategie fra loro (#106): quella in
        // dollari cresce con la size, questa no.
        public decimal ExpectancyR { get; set; }
        public decimal NetR { get; set; }
        public decimal AvgRR { get; set; }

        /// <summary>
        /// L'incertezza dell'expectancy in R: errore standard della media.
        /// </summary>
        /// <remarks>
        /// Con diciannove trade "+0,85R" non è +0,85R, è un intervallo largo — e
        /// leggerlo come una certezza è il modo più comune di rovinarsi una
        /// strategia che funzionava. Questo numero è ciò che permette di
        /// scriverlo accanto (`±0,42R`) invece di far finta che il campione sia
        /// abbastanza grande. Zero quando i trade con R definito sono meno di
        /// due: con uno solo la dispersione non esiste.
        /// </remarks>
        public decimal ExpectancyRStdErr { get; set; }
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

    /// <summary>
    /// Un mese di risultati, per la vista "come sta andando la strategia mese
    /// per mese". Il netto in dollari sta a parte perché
    /// <see cref="MetricsBlockDto.Expectancy"/> è una media per trade, non un
    /// totale: sono due letture diverse dello stesso mese.
    /// </summary>
    public class MonthlyPerformanceDto
    {
        public DateTime Month { get; set; }
        public decimal NetPnL { get; set; }
        public MetricsBlockDto Metrics { get; set; } = new();
    }

    public class DisciplinePointDto
    {
        public DateTime PeriodStart { get; set; }
        public decimal AdherenceRate { get; set; }
        public int TotalTrades { get; set; }
    }
    
        
 }

