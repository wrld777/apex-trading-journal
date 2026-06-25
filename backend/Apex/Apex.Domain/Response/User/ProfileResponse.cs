namespace Apex.Domain.Response.User
{
    public class ProfileResponse
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Instrument { get; set; } = string.Empty;
        public decimal AccountSize { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
