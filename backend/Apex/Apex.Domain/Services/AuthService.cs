using System.Security.Cryptography;
using System.Text;
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
    private readonly IPasswordResetTokenRepository _resetTokenRepository;
    private readonly IEmailSender _emailSender;
    private readonly EmailSettings _emailSettings;
    private readonly IMapper _mapper;

    public AuthService(
        IUserRepository userRepository,
        IPasswordResetTokenRepository resetTokenRepository,
        IEmailSender emailSender,
        EmailSettings emailSettings,
        IMapper mapper)
    {
        _mapper = mapper;
        _userRepository = userRepository;
        _resetTokenRepository = resetTokenRepository;
        _emailSender = emailSender;
        _emailSettings = emailSettings;
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
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            PasswordHash = passwordHash,
        };

        var created = await _userRepository.CreateUserAsync(user, ct);

        // L'email di benvenuto non è parte della registrazione: se la posta è
        // giù, l'account è comunque stato creato e dirlo altrimenti sarebbe una
        // bugia. `SendAsync` non solleva mai, per la stessa ragione.
        var welcome = AccountEmails.Welcome(created.FirstName, _emailSettings.AppBaseUrl);
        await _emailSender.SendAsync(created.Email, created.DisplayName, welcome.Subject, welcome.Html, ct);

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

        // Solo sugli accessi riusciti: avvisare dei tentativi falliti insegnerebbe
        // a chi prova le password che l'indirizzo esiste.
        if (_emailSettings.NotifyOnLogin)
        {
            var alert = AccountEmails.NewSignIn(user.FirstName, DateTime.UtcNow);
            await _emailSender.SendAsync(user.Email, user.DisplayName, alert.Subject, alert.Html, ct);
        }

        return Result<UserDto>.Success(_mapper.Map<UserDto>(user));
    }

    /// <summary>
    /// Richiesta di reimpostazione: genera un link e lo spedisce.
    /// </summary>
    /// <remarks>
    /// Riesce <b>sempre</b>, anche se l'indirizzo non è di nessuno. Rispondere
    /// "questa email non esiste" trasformerebbe questo endpoint in un modo di
    /// scoprire chi è iscritto, provando indirizzi uno a uno.
    /// </remarks>
    public async Task<Result<bool>> ForgotPasswordAsync(string email, CancellationToken ct)
    {
        var user = await _userRepository.GetByEmailAsync(email, ct);
        if (user is null)
            return Result<bool>.Success(true);

        // Un link nuovo chiude quelli aperti: se ne vale sempre e solo uno.
        await _resetTokenRepository.InvalidateAllForUserAsync(user.Id, ct);

        var token = GenerateToken();
        await _resetTokenRepository.CreateAsync(new PasswordResetToken
        {
            UserId = user.Id,
            TokenHash = HashToken(token),
            ExpiresAt = DateTime.UtcNow.AddMinutes(_emailSettings.ResetTokenValidMinutes),
        }, ct);

        var url = $"{_emailSettings.AppBaseUrl.TrimEnd('/')}/reset-password?token={token}";
        var mail = AccountEmails.PasswordReset(user.FirstName, url, _emailSettings.ResetTokenValidMinutes);
        await _emailSender.SendAsync(user.Email, user.DisplayName, mail.Subject, mail.Html, ct);

        return Result<bool>.Success(true);
    }

    /// <summary>Riscrive la password a fronte di un token valido, non scaduto e non ancora usato.</summary>
    public async Task<Result<bool>> ResetPasswordAsync(string token, string newPassword, CancellationToken ct)
    {
        var stored = await _resetTokenRepository.GetByHashAsync(HashToken(token), ct);
        if (stored is null || stored.UsedAt is not null)
            return Result<bool>.Failure(Error.FromAuthError(AuthErrors.ResetTokenInvalid));

        if (stored.ExpiresAt <= DateTime.UtcNow)
            return Result<bool>.Failure(Error.FromAuthError(AuthErrors.ResetTokenExpired));

        string passwordHash;
        try
        {
            passwordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        }
        catch
        {
            return Result<bool>.Failure(Error.FromAuthError(AuthErrors.PasswordHashFailed));
        }

        stored.User.PasswordHash = passwordHash;
        await _userRepository.UpdateAsync(stored.User, ct);

        stored.UsedAt = DateTime.UtcNow;
        await _resetTokenRepository.UpdateAsync(stored, ct);

        return Result<bool>.Success(true);
    }

    /* ── PRIVATE HELPERS ── */

    // 32 byte da un generatore crittografico, in Base64 adatto a un URL. Un GUID
    // sarebbe più comodo e sbagliato: non è imprevedibile per costruzione.
    private static string GenerateToken() =>
        Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
            .Replace('+', '-').Replace('/', '_').TrimEnd('=');

    // In tabella va solo l'hash. Niente salt e niente BCrypt: il token ha già
    // 256 bit di entropia, quindi non c'è un dizionario da cui difendersi, e la
    // ricerca per hash dev'essere una sola query.
    private static string HashToken(string token) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token))).ToLowerInvariant();
}
