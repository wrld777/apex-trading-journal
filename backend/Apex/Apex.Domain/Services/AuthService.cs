using Apex.Domain.Common;
using Apex.Domain.Contracts;
using Apex.Domain.Entities;
using Apex.Domain.Entities.Apex.Domain.Models;
using Apex.Domain.Models;
using Apex.Domain.Repositories;
using Apex.Domain.Request.User;
using Apex.Domain.Response.User;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Apex.Domain.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly JwtSettings _jwtSettings;

    public AuthService(IUserRepository userRepository, IOptions<JwtSettings> jwtSettings)
    {
        _userRepository = userRepository;
        _jwtSettings = jwtSettings.Value;
    }

    public async Task<Result<AuthResponse>> RegisterAsync(RegisterRequest request, CancellationToken ct)
    {
        var existing = await _userRepository.GetByEmailAsync(request.Email, ct);
        if (existing is not null)
            return Result<AuthResponse>.Failure(Error.FromAuthError(AuthErrors.EmailAlreadyRegistered));

        string passwordHash;
        try
        {
            passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        }
        catch
        {
            return Result<AuthResponse>.Failure(Error.FromAuthError(AuthErrors.PasswordHashFailed));
        }

        var user = new User
        {
            Name = request.Name,
            Email = request.Email,
            PasswordHash = passwordHash,
        };

        var created = await _userRepository.CreateUserAsync(user, ct);

        var token = GenerateToken(created);
        if (token is null)
            return Result<AuthResponse>.Failure(Error.FromAuthError(AuthErrors.TokenGenerationFailed));

        return Result<AuthResponse>.Success(new AuthResponse
        {
            UserId = created.Id,
            Name = created.Name,
            Email = created.Email,
            Token = token
        });
    }

    public async Task<Result<AuthResponse>> LoginAsync(LoginRequest request, CancellationToken ct)
    {
        var user = await _userRepository.GetByEmailAsync(request.Email, ct);
        if (user is null)
            return Result<AuthResponse>.Failure(Error.FromAuthError(AuthErrors.InvalidCredentials));

        var validPassword = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
        if (!validPassword)
            return Result<AuthResponse>.Failure(Error.FromAuthError(AuthErrors.InvalidCredentials));

        var token = GenerateToken(user);
        if (token is null)
            return Result<AuthResponse>.Failure(Error.FromAuthError(AuthErrors.TokenGenerationFailed));

        return Result<AuthResponse>.Success(new AuthResponse
        {
            UserId = user.Id,
            Name = user.Name,
            Email = user.Email,
            Token = token
        });
    }

    private string? GenerateToken(User user)
    {
        try
        {
            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_jwtSettings.Secret));

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.Name)
            };

            var token = new JwtSecurityToken(
                issuer: _jwtSettings.Issuer,
                audience: _jwtSettings.Audience,
                claims: claims,
                expires: DateTime.UtcNow.AddDays(_jwtSettings.ExpiryDays),
                signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
        catch
        {
            return null;
        }
    }
}