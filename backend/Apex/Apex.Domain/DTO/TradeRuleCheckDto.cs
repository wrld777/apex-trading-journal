using System;

namespace Apex.Domain.DTO
{
    public class TradeRuleCheckDto
    {
        public Guid StrategyRuleId { get; set; }
        public bool Checked { get; set; }

        // Denormalizzati dalla regola, in sola lettura (stessa idea di Symbol su
        // TradeDto): senza di questi un trade salvato mostrerebbe l'aderenza come
        // una lista di GUID. In ingresso sono ignorati — la verità sta su
        // StrategyRule, e il service valida che la regola sia di quella strategia.
        public string? Label { get; set; }
        public int? Order { get; set; }
        public bool? Required { get; set; }
    }
}
