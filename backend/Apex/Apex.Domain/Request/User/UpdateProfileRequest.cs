namespace Apex.Domain.Request.User
{
    public class UpdateProfileRequest
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        // Data URI dell'immagine, o null per rimuovere la foto.
        public string? AvatarUrl { get; set; }
    }
}
