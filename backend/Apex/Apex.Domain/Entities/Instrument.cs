using Apex.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Apex.Domain.Entities
{
    public class Instrument
    {
        public Guid InstrumentId { get; set; }
        public string Symbol { get; set; }
        public string InstrumentName { get; set; }

        public decimal PointValue { get; set; }
        public decimal TickSize { get; set; }

        public decimal TickValue { get; set; }
        public string Currency { get; set; }
        public InstrumentType Type { get; set; }
    }
}
