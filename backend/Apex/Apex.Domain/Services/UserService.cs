using AutoMapper;
using Apex.Domain.Common;
using Apex.Domain.Contracts;
using Apex.Domain.Repositories;
using Apex.Domain.Request.User;
using Apex.Domain.Response.User;

namespace Apex.Domain.Services
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;
        private readonly IMapper _mapper;

        public UserService(IUserRepository userRepository, IMapper mapper)
        {
            _userRepository = userRepository;
            _mapper = mapper;
        }

        public async Task<Result<ProfileResponse>> GetProfileAsync(Guid userId, CancellationToken ct)
        {
            var user = await _userRepository.GetByIdAsync(userId, ct);
            if (user is null)
                return Result<ProfileResponse>.Failure(Error.FromUserError(UserErrors.NotFound(userId)));

            return Result<ProfileResponse>.Success(_mapper.Map<ProfileResponse>(user));
        }

        public async Task<Result<ProfileResponse>> UpdateProfileAsync(Guid userId, UpdateProfileRequest request, CancellationToken ct)
        {
            var user = await _userRepository.GetByIdAsync(userId, ct);
            if (user is null)
                return Result<ProfileResponse>.Failure(Error.FromUserError(UserErrors.NotFound(userId)));

            user.FirstName = request.FirstName;
            user.LastName = request.LastName;
            user.AvatarUrl = string.IsNullOrWhiteSpace(request.AvatarUrl) ? null : request.AvatarUrl;

            var updated = await _userRepository.UpdateAsync(user, ct);
            return Result<ProfileResponse>.Success(_mapper.Map<ProfileResponse>(updated));
        }

        public async Task<Result<bool>> ChangePasswordAsync(Guid userId, ChangePasswordRequest request, CancellationToken ct)
        {
            var user = await _userRepository.GetByIdAsync(userId, ct);
            if (user is null)
                return Result<bool>.Failure(Error.FromUserError(UserErrors.NotFound(userId)));

            if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
                return Result<bool>.Failure(Error.FromUserError(UserErrors.CurrentPasswordWrong));

            // Cambiare la password con quella già in uso non è un errore di sistema,
            // ma quasi sempre è un fraintendimento: meglio dirlo che fingere successo.
            if (BCrypt.Net.BCrypt.Verify(request.NewPassword, user.PasswordHash))
                return Result<bool>.Failure(Error.FromUserError(UserErrors.NewPasswordSameAsCurrent));

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            await _userRepository.UpdateAsync(user, ct);

            return Result<bool>.Success(true);
        }
    }
}
