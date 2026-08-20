// Apex.API/Controllers/AuthController.cs
using Apex.Domain.Contracts;
using Apex.Domain.Request.User;
using Apex.Domain.Response.User;
using Microsoft.AspNetCore.Mvc;

namespace Apex.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IManageTokenService _tokenService;

    public AuthController(IAuthService authService, IManageTokenService tokenService)
    {
        _authService = authService;
        _tokenService = tokenService;
    }

    // POST /api/auth/register — registers the user but does NOT log them in.
    [HttpPost("register")]
    public async Task<IActionResult> Register(
        [FromBody] RegisterRequest request,
        CancellationToken ct)
    {
        var result = await _authService.RegisterAsync(request, ct);

        if (!result.IsSuccess)
            return BadRequest(result.Error);

        // No token: prompt the client to log in. Never expose the password hash.
        return Ok(new
        {
            message = "Registrazione completata. Effettua il login per continuare.",
            userId = result.Value!.Id,
            email = result.Value.Email,
        });
    }

    // POST /api/auth/login — validates credentials (service) 
    [HttpPost("login")]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequest request,
        CancellationToken ct)
    {
        var loginResult = await _authService.LoginAsync(request.Email, request.Password, ct);
        if (!loginResult.IsSuccess)
            return Unauthorized(loginResult.Error);

        var user = loginResult.Value!;

        var tokenResult = await _tokenService.GenerateTokenAsync(user, ct);
        if (!tokenResult.IsSuccess)
            return BadRequest(tokenResult.Error);

        var accessToken = tokenResult.Value!;
        return Ok(new AuthResponse
        {
            UserId = user.Id,
            Name = user.DisplayName,
            Email = user.Email,
            Token = accessToken.Token,
            ExpirationDate = accessToken.ExpirationDate,
        });
    }

    // POST /api/auth/forgot-password — spedisce il link di reimpostazione.
    // Risponde 200 anche per un indirizzo che non esiste: una risposta diversa
    // direbbe a chi prova indirizzi quali sono registrati.
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(
        [FromBody] ForgotPasswordRequest request,
        CancellationToken ct)
    {
        await _authService.ForgotPasswordAsync(request.Email, ct);
        return Ok(new { message = "If that email has an account, a reset link is on its way." });
    }

    // POST /api/auth/reset-password — riscrive la password col token del link.
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(
        [FromBody] ResetPasswordRequest request,
        CancellationToken ct)
    {
        var result = await _authService.ResetPasswordAsync(request.Token, request.NewPassword, ct);
        if (!result.IsSuccess)
            return BadRequest(result.Error);

        // Nessun token di sessione: si rientra dal login, come dopo la registrazione.
        return Ok(new { message = "Password updated. Sign in with your new password." });
    }
}
