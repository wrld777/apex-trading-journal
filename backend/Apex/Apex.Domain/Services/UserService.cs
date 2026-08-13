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

            user.Name = request.Name;
            user.Instrument = request.Instrument;

            var updated = await _userRepository.UpdateAsync(user, ct);
            return Result<ProfileResponse>.Success(_mapper.Map<ProfileResponse>(updated));
        }
    }
}
