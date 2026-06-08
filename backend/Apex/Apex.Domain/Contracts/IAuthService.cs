using Apex.Domain.Common;
using Apex.Domain.DTO;
using Apex.Domain.Request.User;

namespace Apex.Domain.Contracts
{
    public interface IAuthService
    {
        // Services return DTOs only. Token issuing happens in the controller.
        Task<Result<UserDto>> RegisterAsync(RegisterRequest request, CancellationToken ct);
        Task<Result<UserDto>> LoginAsync(LoginRequest request, CancellationToken ct);
    }
}
