using Apex.Domain.Entities;
using Apex.Domain.Repositories;
using Apex.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace Apex.Infrastructure.Repositories
{
    public class TradeRepository : ITradeRepository
    {
        private readonly AppDbContext _context;
        public TradeRepository( AppDbContext context )
        {
            _context = context;
            
        }

        public async Task<IEnumerable<Trade>> GetAllAsync( Guid userId,CancellationToken ct)
        {
            return await _context.Trades
                .AsNoTracking()
                .Where(t  => t.UserId == userId)
                .OrderByDescending(t => t.EntryTime)
                .ToListAsync();
        }

        public async Task<Trade> GetByIdAsync( Guid id, CancellationToken ct)
        {
            return await _context.Trades
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == id);
        }

        public async Task<Trade> CreateAsync(Trade trade)
        {
            _context.Trades.Add(trade);
            await _context.SaveChangesAsync();
            return trade;
        }

        public async Task<Trade> UpdateAsync(Trade trade)
        {
            trade.UpdatedAt = DateTime.UtcNow;
            _context.Trades.Update(trade);
            await _context.SaveChangesAsync();
            return trade;
        }

        public async Task DeleteAsync(Trade trade)
        {
                _context.Trades.Remove(trade);
                await _context.SaveChangesAsync();

        }


    }
}
