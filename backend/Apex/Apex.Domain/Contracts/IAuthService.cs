using Apex.Domain.Common;
using Apex.Domain.DTO;
using Apex.Domain.Request.User;

namespace Apex.Domain.Contracts
{
    public interface IAuthService
    {

        Task<Result<UserDto>> RegisterAsync(RegisterRequest request, CancellationToken ct);
        Task<Result<UserDto>> LoginAsync(string email, string password, CancellationToken ct);
        Task<Result<bool>> ForgotPasswordAsync(string email, CancellationToken ct);
        Task<Result<bool>> ResetPasswordAsync(string token, string newPassword, CancellationToken ct);
    }
}
