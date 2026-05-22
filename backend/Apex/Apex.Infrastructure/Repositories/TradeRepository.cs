using Apex.Domain.Entities;
using Apex.Domain.Repositories;
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
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.EntryTime)
            .ToListAsync(ct);
    }

    public async Task<Trade?> GetByIdAsync(Guid id, CancellationToken ct)
    {
        return await _context.Trades
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
            .Where(t => t.UserId == userId && t.EntryTime >= startDate && t.EntryTime <= endDate)
            .OrderByDescending(t => t.EntryTime)
            .ToListAsync(ct);
    }

    public async Task<List<Trade>> GetBySetupAsync(string setup, CancellationToken ct)
    {
        return await _context.Trades
            .AsNoTracking()
            .Where(t => t.Setup == setup)
            .OrderByDescending(t => t.EntryTime)
            .ToListAsync(ct);
    }

    public async Task<List<Trade>> GetBySessionAsync(string session, CancellationToken ct)
    {
        return await _context.Trades
            .AsNoTracking()
            .Where(t => t.Session == session)
            .OrderByDescending (t => t.EntryTime)
            .ToListAsync (ct);
    }





    }