namespace Apex.Domain.DTO
{
    /// <summary>
    /// Quanto costa un errore, contato invece che raccontato.
    /// </summary>
    /// <remarks>
    /// Il campo <c>Mistakes</c> del trade resta il racconto; l'etichetta è ciò
    /// che permette di sommarlo. Senza, "revenge trade dopo la perdita di ieri"
    /// è una frase che nessuna analisi può leggere.
    /// </remarks>
    public class MistakeImpactDto
    {
        public string Tag { get; set; } = string.Empty;
        public int Occurrences { get; set; }
        public decimal NetR { get; set; }
        public decimal NetPnL { get; set; }
        public decimal WinRate { get; set; }
        /// La differenza di R medio fra i trade con questa etichetta e tutti gli
        /// altri: è il costo dell'errore, non il risultato dei trade in cui è
        /// capitato.
        public decimal AvgRDelta { get; set; }
    }

    /// <summary>
    /// Come si va <b>dopo</b> una perdita, rispetto a tutto il resto.
    /// </summary>
    /// <remarks>
    /// È il numero che quasi nessuno guarda: se il win rate crolla subito dopo
    /// uno stop, il problema non è la strategia, è cosa succede nei dieci minuti
    /// dopo lo stop. I trade si ordinano per orario d'ingresso, e "dopo" è il
    /// trade immediatamente successivo — anche a giorni di distanza.
    /// </remarks>
    public class TiltDto
    {
        public MetricsBlockDto AfterLoss { get; set; } = new();
        public MetricsBlockDto AfterWin { get; set; } = new();
        public MetricsBlockDto Baseline { get; set; } = new();
        /// Minuti passati fra la perdita e il trade successivo, in mediana:
        /// rientrare di corsa è la forma che il tilt prende più spesso.
        public int MedianMinutesAfterLoss { get; set; }
    }

    /// <summary>
    /// Come vanno il primo, il secondo, il terzo trade della giornata.
    /// </summary>
    /// <remarks>
    /// L'overtrading non si vede nel totale: si vede qui, dove di solito la
    /// curva crolla dopo il secondo.
    /// </remarks>
    public class SequenceBucketDto
    {
        /// 1, 2, 3… e l'ultimo raccoglie tutti quelli oltre la soglia.
        public int Position { get; set; }
        public string Label { get; set; } = string.Empty;
        public MetricsBlockDto Metrics { get; set; } = new();
        public decimal NetPnL { get; set; }
    }

    public class SequenceDto
    {
        public List<SequenceBucketDto> Buckets { get; set; } = new();
        public decimal AvgTradesPerDay { get; set; }
        public int MaxTradesInADay { get; set; }
        public int TradingDays { get; set; }
    }

    /// <summary>
    /// Quanto varia il rischio da un trade all'altro.
    /// </summary>
    /// <remarks>
    /// È la domanda che tiene in piedi tutto il resto dell'app: sommare R ha
    /// senso solo se ogni R vale più o meno lo stesso. Se un trade rischia
    /// cinque volte l'altro, ogni pagina che somma R sta mentendo un po'.
    /// </remarks>
    public class RiskConsistencyDto
    {
        public int TradesWithRisk { get; set; }
        public decimal MedianRisk { get; set; }
        public decimal MinRisk { get; set; }
        public decimal MaxRisk { get; set; }
        /// Deviazione standard sul rischio medio, in percentuale. Sotto il 25%
        /// la size è di fatto costante; sopra il 50% l'R diventa un'unità di
        /// misura elastica.
        public decimal VariationPct { get; set; }
        public List<RiskPointDto> Points { get; set; } = new();
    }

    public class RiskPointDto
    {
        public DateTime Date { get; set; }
        public decimal Risk { get; set; }
        public decimal? RMultiple { get; set; }
    }

    /// <summary>
    /// La settimana appena passata, messa accanto a quella prima.
    /// </summary>
    /// <remarks>
    /// I journal muoiono senza un momento in cui si guardano. Questa è quella
    /// pagina: cosa è cambiato, quale regola è slittata, quale errore è tornato.
    /// </remarks>
    public class WeeklyReviewDto
    {
        public DateTime WeekStart { get; set; }
        public MetricsBlockDto ThisWeek { get; set; } = new();
        public MetricsBlockDto LastWeek { get; set; } = new();
        public decimal NetPnL { get; set; }
        public decimal LastWeekNetPnL { get; set; }
        /// Percentuale di regole rispettate, questa settimana e quella prima.
        public decimal Adherence { get; set; }
        public decimal LastWeekAdherence { get; set; }
        /// Le regole saltate più spesso questa settimana.
        public List<SlippedRuleDto> SlippedRules { get; set; } = new();
        /// Gli errori etichettati questa settimana, i più costosi in cima.
        public List<MistakeImpactDto> Mistakes { get; set; } = new();
        public int TradingDays { get; set; }
    }

    public class SlippedRuleDto
    {
        public string Label { get; set; } = string.Empty;
        public string StrategyName { get; set; } = string.Empty;
        public int TimesSkipped { get; set; }
        public int TimesTotal { get; set; }
    }
}
