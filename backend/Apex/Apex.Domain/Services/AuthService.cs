using Apex.Domain.Common;
using Apex.Domain.Contracts;
using Apex.Domain.DTO;
using Apex.Domain.Entities;
using Apex.Domain.Repositories;
using Apex.Domain.Request.User;
using AutoMapper;

namespace Apex.Domain.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IMapper _mapper;

    public AuthService(IUserRepository userRepository, IMapper mapper)
    {
        _mapper = mapper;
        _userRepository = userRepository;
    }

    public async Task<Result<UserDto>> RegisterAsync(RegisterRequest request, CancellationToken ct)
    {
        var existing = await _userRepository.GetByEmailAsync(request.Email, ct);
        if (existing is not null)
            return Result<UserDto>.Failure(Error.FromAuthError(AuthErrors.EmailAlreadyRegistered));

        string passwordHash;
        try
        {
            passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        }
        catch
        {
            return Result<UserDto>.Failure(Error.FromAuthError(AuthErrors.PasswordHashFailed));
        }

        var user = new User
        {
            Name = request.Name,
            Email = request.Email,
            PasswordHash = passwordHash,
        };

        var created = await _userRepository.CreateUserAsync(user, ct);
        return Result<UserDto>.Success(_mapper.Map<UserDto>(created));
    }

    public async Task<Result<UserDto>> LoginAsync(string email, string password, CancellationToken ct)
    {
        var user = await _userRepository.GetByEmailAsync(email, ct);
        if (user is null)
            return Result<UserDto>.Failure(Error.FromAuthError(AuthErrors.InvalidCredentials));

        var validPassword = BCrypt.Net.BCrypt.Verify(password, user.PasswordHash);
        if (!validPassword)
            return Result<UserDto>.Failure(Error.FromAuthError(AuthErrors.InvalidCredentials));


        return Result<UserDto>.Success(_mapper.Map<UserDto>(user));
    }

}
