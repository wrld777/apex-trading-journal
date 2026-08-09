using Apex.Domain.Entities;
using Apex.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Apex.Infrastructure.DbContext;

/// <summary>
/// Catalogo strumenti globale (issue #94). Precaricato via HasData: non è modificabile
/// dall'utente, quindi vive nelle migration insieme allo schema.
/// Gli Id sono costanti hardcodate: HasData richiede chiavi stabili, altrimenti ogni
/// migration successiva rigenererebbe delete+insert delle righe.
/// </summary>
internal static class InstrumentSeed
{
    public static void Seed(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Instrument>().HasData(
            //        Id                                      Symbol  Nome                            Point  Tick   TickValue
            Make("a1000000-0000-0000-0000-000000000001", "ES",  "E-mini S&P 500",              50m,   0.25m, 12.50m),
            Make("a1000000-0000-0000-0000-000000000002", "MES", "Micro E-mini S&P 500",         5m,   0.25m,  1.25m),
            Make("a1000000-0000-0000-0000-000000000003", "NQ",  "E-mini Nasdaq-100",           20m,   0.25m,  5.00m),
            Make("a1000000-0000-0000-0000-000000000004", "MNQ", "Micro E-mini Nasdaq-100",      2m,   0.25m,  0.50m),
            Make("a1000000-0000-0000-0000-000000000005", "YM",  "E-mini Dow ($5)",              5m,   1m,     5.00m),
            Make("a1000000-0000-0000-0000-000000000006", "MYM", "Micro E-mini Dow",             0.50m, 1m,    0.50m),
            Make("a1000000-0000-0000-0000-000000000007", "RTY", "E-mini Russell 2000",         50m,   0.10m,  5.00m),
            Make("a1000000-0000-0000-0000-000000000008", "M2K", "Micro E-mini Russell 2000",    5m,   0.10m,  0.50m),
            Make("a1000000-0000-0000-0000-000000000009", "GC",  "Gold",                       100m,   0.10m, 10.00m),
            Make("a1000000-0000-0000-0000-000000000010", "MGC", "Micro Gold",                  10m,   0.10m,  1.00m),
            Make("a1000000-0000-0000-0000-000000000011", "CL",  "Crude Oil",                 1000m,   0.01m, 10.00m),
            Make("a1000000-0000-0000-0000-000000000012", "MCL", "Micro Crude Oil",            100m,   0.01m,  1.00m)
        );
    }

    private static Instrument Make(
        string id, string symbol, string name, decimal pointValue, decimal tickSize, decimal tickValue) =>
        new()
        {
            InstrumentId = Guid.Parse(id),
            Symbol = symbol,
            InstrumentName = name,
            PointValue = pointValue,
            TickSize = tickSize,
            TickValue = tickValue,
            Currency = "USD",
            Type = InstrumentType.Future
        };
}
