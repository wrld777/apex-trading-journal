using Apex.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Apex.Domain.Request.Trade
{
    public class TradeQuery
    {
        public DateTime? From { get; set; }
        public DateTime? To { get; set; }
        public string? Symbol { get; set; }
        public string? Setup { get; set; }
        public string? Session { get; set; }
        public Direction? Direction { get; set; }  
        public TradeStatus? Status { get; set; }     
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 25;
        public string Sort { get; set; } = "entryTime";
        public string SortDir { get; set; } = "desc";
    }
}
