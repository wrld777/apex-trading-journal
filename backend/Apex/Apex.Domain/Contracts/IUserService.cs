using Apex.Domain.Common;
using Apex.Domain.Request.User;
using Apex.Domain.Response.User;

namespace Apex.Domain.Contracts
{
    public interface IUserService
    {
        Task<Result<ProfileResponse>> GetProfileAsync(Guid userId, CancellationToken ct);
        Task<Result<ProfileResponse>> UpdateProfileAsync(Guid userId, UpdateProfileRequest request, CancellationToken ct);
        Task<Result<bool>> ChangePasswordAsync(Guid userId, ChangePasswordRequest request, CancellationToken ct);
    }
}
