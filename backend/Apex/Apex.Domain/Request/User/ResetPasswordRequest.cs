namespace Apex.Domain.Request.User
{
    public class ResetPasswordRequest
    {
        /// Il token in chiaro, così com'è arrivato nel link dell'email.
        public string Token { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
}
