namespace Apex.Domain.Entities;

public class Strategy
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;


    public Guid UserId { get; set; }
    public User User { get; set; } = null!;


    public List<StrategyRule> Rules { get; set; } = new();

    // Strumenti su cui la strategia opera (#95). Many-to-many verso il catalogo
    // globale: le entità Instrument sono condivise e non appartengono alla strategia,
    // qui si scrivono solo le righe della tabella di join.
    public List<Instrument> Instruments { get; set; } = new();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
