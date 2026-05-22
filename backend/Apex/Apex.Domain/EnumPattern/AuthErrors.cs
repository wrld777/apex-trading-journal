namespace Apex.Domain.Common;

public class AuthErrors
{
    public string Message { get; }

    private AuthErrors(string message)
    {
        Message = message;
    }

    // ── Login ──
    public static readonly AuthErrors InvalidCredentials =
        new("Invalid email or password.");

    public static readonly AuthErrors AccountNotFound =
        new("No account found with these credentials.");

    public static readonly AuthErrors AccountSuspended =
        new("Your account has been suspended. Please contact support.");

    public static readonly AuthErrors AccountNotVerified =
        new("Please verify your email address before logging in.");

    // ── Registration ──
    public static readonly AuthErrors EmailAlreadyRegistered =
        new("An account with this email already exists.");

    public static readonly AuthErrors RegistrationFailed =
        new("Registration failed. Please try again.");

    // ── Token ──
    public static readonly AuthErrors TokenGenerationFailed =
        new("Failed to generate authentication token. Please try again.");

    public static readonly AuthErrors TokenExpired =
        new("Your session has expired. Please login again.");

    public static readonly AuthErrors TokenInvalid =
        new("Invalid or malformed token.");

    public static readonly AuthErrors TokenRevoked =
        new("This token has been revoked. Please login again.");

    public static readonly AuthErrors RefreshTokenExpired =
        new("Your refresh token has expired. Please login again.");

    public static readonly AuthErrors RefreshTokenInvalid =
        new("Invalid refresh token.");

    // ── Password ──
    public static readonly AuthErrors PasswordHashFailed =
        new("An error occurred while securing your password. Please try again.");

    public static readonly AuthErrors PasswordMismatch =
        new("Passwords do not match.");

    public static readonly AuthErrors CurrentPasswordIncorrect =
        new("Current password is incorrect.");

    // ── Internal ──
    public static readonly AuthErrors Internal =
        new("An internal authentication error occurred. Please try again.");
}