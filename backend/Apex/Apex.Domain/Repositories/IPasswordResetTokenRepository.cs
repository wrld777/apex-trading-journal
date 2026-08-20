using Apex.Domain.Entities;

namespace Apex.Domain.Repositories;

public interface IPasswordResetTokenRepository
{
    Task<PasswordResetToken> CreateAsync(PasswordResetToken token, CancellationToken ct);

    /// Il token si cerca per hash: quello in chiaro non è mai stato salvato.
    Task<PasswordResetToken?> GetByHashAsync(string tokenHash, CancellationToken ct);

    /// Chiudere i link ancora aperti di un utente. Chiederne uno nuovo, o
    /// cambiare password, deve invalidare i precedenti.
    Task InvalidateAllForUserAsync(Guid userId, CancellationToken ct);

    Task UpdateAsync(PasswordResetToken token, CancellationToken ct);
}
