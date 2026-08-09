using Apex.Domain.Entities;
using Apex.Domain.Repositories;
using Apex.Domain.Request.Trade;
using Apex.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;

namespace Apex.Infrastructure.Repositories;

public class TradeRepository : ITradeRepository
{
    private readonly AppDbContext _context;

    public TradeRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Trade>> GetAllAsync(Guid userId, CancellationToken ct)
    {
        return await _context.Trades
            .Include(t => t.Instrument)
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.EntryTime)
            .ToListAsync(ct);
    }

    public async Task<Trade?> GetByIdAsync(Guid id, CancellationToken ct)
    {
        return await _context.Trades
            .Include(t => t.RuleChecks)
            .Include(t => t.Instrument)
            .FirstOrDefaultAsync(t => t.Id == id, ct);
    }

    public async Task<Trade> CreateAsync(Trade trade, CancellationToken ct)
    {
        _context.Trades.Add(trade);
        await _context.SaveChangesAsync(ct);
        return trade;
    }

    public async Task<Trade> UpdateAsync(Trade trade, CancellationToken ct)
    {
        trade.UpdatedAt = DateTime.UtcNow;
        _context.Trades.Update(trade);

        foreach (var rc in trade.RuleChecks)
            _context.Entry(rc).State = EntityState.Added;

        await _context.SaveChangesAsync(ct);
        return trade;
    }

    public async Task DeleteAsync(Trade trade, CancellationToken ct)
    {
        _context.Trades.Remove(trade);
        await _context.SaveChangesAsync(ct);
    }

    public async Task<List<Trade>> GetByDateRangeAsync(Guid userId, DateTime startDate, DateTime endDate, CancellationToken ct)
    {
        return await _context.Trades
            .AsNoTracking()
            .Include(t => t.Instrument)
            .Where(t => t.UserId == userId && t.EntryTime >= startDate && t.EntryTime <= endDate)
            .OrderByDescending(t => t.EntryTime)
            .ToListAsync(ct);
    }

    public async Task<(List<Trade> items, int total)> GetPagedAsync(Guid userId, TradeQuery q, CancellationToken ct)
    {
        var query = _context.Trades.
            AsNoTracking().
            Include(t => t.Instrument).
            Where(t => t.UserId == userId);

        // Postgres 'timestamp with time zone' accetta solo DateTime in UTC.
        // Se il client manda una data senza fuso (es. ?from=2026-04-01), il Kind è Unspecified: forziamolo a UTC.
        if (q.From is not null)
        {
            var from = DateTime.SpecifyKind(q.From.Value, DateTimeKind.Utc);
            query = query.Where(t => t.EntryTime >= from);
        }
        if (q.To is not null)
        {
            var to = DateTime.SpecifyKind(q.To.Value, DateTimeKind.Utc);
            query = query.Where(t => t.EntryTime <= to);
        }
        // Il simbolo vive solo su Instrument (#94): filtro e sort passano dalla navigation.
        // Match esatto, non Contains: con un catalogo chiuso "NQ" deve dare NQ e non anche MNQ.
        // Basta normalizzare l'input, i simboli a catalogo sono già maiuscoli (seed).
        if (!string.IsNullOrWhiteSpace(q.Symbol))
        {
            var symbol = q.Symbol.Trim().ToUpper();
            query = query.Where(t => t.Instrument.Symbol == symbol);
        }
        if (!string.IsNullOrWhiteSpace(q.Setup)) query = query.Where(t => t.Setup == q.Setup);
        if (!string.IsNullOrWhiteSpace(q.Session)) query = query.Where(t => t.Session == q.Session);
        if (q.Direction is not null) query = query.Where(t => t.Direction == q.Direction);
        if (q.Status is not null) query = query.Where(t => t.Status == q.Status);

        var total = await query.CountAsync(ct);

        query = (q.Sort.ToLower(), q.SortDir.ToLower()) switch
        {
            ("pnl", "asc") => query.OrderBy(t => t.PnL),
            ("pnl", _) => query.OrderByDescending(t => t.PnL),
            ("riskreward", "asc") => query.OrderBy(t => t.RiskReward),
            ("riskreward", _) => query.OrderByDescending(t => t.RiskReward),
            ("symbol", "asc") => query.OrderBy(t => t.Instrument.Symbol),
            ("symbol", _) => query.OrderByDescending(t => t.Instrument.Symbol),
            (_, "asc") => query.OrderBy(t => t.EntryTime),
            _ => query.OrderByDescending(t => t.EntryTime),
        };

        var itemspaged = await query.
            Skip((q.Page -1) * q.PageSize).
            Take(q.PageSize).
            ToListAsync(ct);

        return (itemspaged, total);

    }

    //con questo metodo prendo tutti i trades con le rules e in base alla strategua se presente , e in base al range di date se presente, per fare le analisi statistiche

    public async Task<List<Trade>> GetForAnalyticsAsync(Guid userId, Guid? StrategyId, DateTime? from, DateTime? to, CancellationToken ct)
    {
        var q = _context.Trades
            .AsNoTracking()
            .Where(t => t.UserId == userId)
            .Include(t => t.Instrument)
            .Include(t => t.Strategy)
            .Include(t => t.RuleChecks)
            .ThenInclude(rc => rc.StrategyRule)
            .AsQueryable();

        if (StrategyId.HasValue) q = q.Where(t => t.StrategyId == StrategyId);
        if (from.HasValue) q = q.Where(t => t.EntryTime >= from.Value);
        if (to.HasValue) q = q.Where(t => t.EntryTime <= to.Value);
        return await q.ToListAsync(ct);
    }





}