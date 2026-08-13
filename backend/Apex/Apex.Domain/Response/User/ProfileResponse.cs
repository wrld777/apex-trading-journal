namespace Apex.Domain.Response.User
{
    public class ProfileResponse
    {
        public Guid Id { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        // Nome e cognome già composti: il client lo mostra e basta, senza
        // rifare la stessa concatenazione in ogni schermata.
        public string DisplayName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
