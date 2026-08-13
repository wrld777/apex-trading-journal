namespace Apex.Domain.Request.User
{
    public class ChangePasswordRequest
    {
        // La password attuale è obbligatoria: senza, chi trovasse una sessione
        // aperta potrebbe cambiarla e prendersi l'account.
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
}
