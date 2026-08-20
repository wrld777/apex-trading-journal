using Apex.Domain.Entities;
using Apex.Domain.Repositories;
using Apex.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;

namespace Apex.Infrastructure.Repositories;

public class PasswordResetTokenRepository : IPasswordResetTokenRepository
{
    private readonly AppDbContext _context;

    public PasswordResetTokenRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PasswordResetToken> CreateAsync(PasswordResetToken token, CancellationToken ct)
    {
        _context.PasswordResetTokens.Add(token);
        await _context.SaveChangesAsync(ct);
        return token;
    }

    public async Task<PasswordResetToken?> GetByHashAsync(string tokenHash, CancellationToken ct)
    {
        return await _context.PasswordResetTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash, ct);
    }

    public async Task InvalidateAllForUserAsync(Guid userId, CancellationToken ct)
    {
        // Segnati come usati invece che cancellati: la riga resta a dire che un
        // link è esistito, ed è ciò che si guarda se un account viene contestato.
        await _context.PasswordResetTokens
            .Where(t => t.UserId == userId && t.UsedAt == null)
            .ExecuteUpdateAsync(s => s.SetProperty(t => t.UsedAt, DateTime.UtcNow), ct);
    }

    public async Task UpdateAsync(PasswordResetToken token, CancellationToken ct)
    {
        _context.PasswordResetTokens.Update(token);
        await _context.SaveChangesAsync(ct);
    }
}
