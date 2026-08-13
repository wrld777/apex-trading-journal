using System.ComponentModel.DataAnnotations.Schema;

namespace Apex.Domain.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    // Immagine ridimensionata lato client e salvata come data URI (#110): niente
    // storage esterno né volumi, così il deploy su VM non guadagna prerequisiti.
    public string? AvatarUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public List<Trade> Trades { get; set; } = new();

    // Il nome da mostrare — saluto, sidebar, claim del JWT. Il cognome è
    // facoltativo, quindi non si concatena a vuoto lasciando uno spazio in coda.
    [NotMapped]
    public string DisplayName =>
        string.Join(' ', new[] { FirstName, LastName }.Where(s => !string.IsNullOrWhiteSpace(s)));
}
