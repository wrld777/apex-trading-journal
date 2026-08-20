namespace Apex.Domain.Entities;

/// <summary>
/// Il permesso, a tempo, di riscrivere la password di un account.
/// </summary>
/// <remarks>
/// In tabella finisce l'**hash** del token, non il token: quello in chiaro esiste
/// solo dentro il link spedito per email. Chi legge il database non deve poter
/// entrare in un account — è la stessa ragione per cui non ci si tiene la
/// password.
/// </remarks>
public class PasswordResetToken
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    /// SHA-256 del token, in esadecimale.
    public string TokenHash { get; set; } = string.Empty;

    public DateTime ExpiresAt { get; set; }

    /// Valorizzato all'uso: un link vale una volta sola, anche se non è scaduto.
    public DateTime? UsedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
