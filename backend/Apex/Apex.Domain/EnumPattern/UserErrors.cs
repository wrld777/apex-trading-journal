namespace Apex.Domain.Common;

public class UserErrors
{
    public string Message { get; }

    private UserErrors(string message)
    {
        Message = message;
    }

    // ── Not Found ──
    public static UserErrors NotFound(Guid id) =>
        new($"User with id '{id}' was not found.");

    public static UserErrors NotFoundByEmail(string email) =>
        new($"User with email '{email}' was not found.");

    // ── Authorization ──
    public static readonly UserErrors Unauthorized =
        new("You are not authorized to perform this action.");

    public static readonly UserErrors Forbidden =
        new("You do not have permission to perform this action.");

    public static readonly UserErrors InvalidCredentials =
        new("Invalid email or password.");

    public static readonly UserErrors TokenExpired =
        new("Your session has expired. Please login again.");

    public static readonly UserErrors InvalidToken =
        new("Invalid or malformed token.");

    public static readonly UserErrors TokenRevoked =
        new("This token has been revoked. Please login again.");

    // ── Validation ──
    public static readonly UserErrors MissingFirstName =
        new("First name is required.");

    public static readonly UserErrors FirstNameTooLong =
        new("First name must not exceed 100 characters.");

    public static readonly UserErrors LastNameTooLong =
        new("Last name must not exceed 100 characters.");

    public static readonly UserErrors AvatarTooLarge =
        new("The profile picture is too large. Please choose a smaller image.");

    public static readonly UserErrors MissingEmail =
        new("Email is required.");

    public static readonly UserErrors InvalidEmailFormat =
        new("Email format is invalid.");

    public static readonly UserErrors EmailAlreadyExists =
        new("An account with this email already exists.");

    public static readonly UserErrors MissingPassword =
        new("Password is required.");

    public static readonly UserErrors PasswordTooShort =
        new("Password must be at least 8 characters.");

    public static readonly UserErrors PasswordTooWeak =
        new("Password must contain at least one uppercase letter, one number and one special character.");

    public static readonly UserErrors MissingCurrentPassword =
        new("Your current password is required.");

    public static readonly UserErrors CurrentPasswordWrong =
        new("The current password is not correct.");

    public static readonly UserErrors NewPasswordSameAsCurrent =
        new("The new password must be different from the current one.");

    // ── Business Rules ──
    public static readonly UserErrors AccountSuspended =
        new("Your account has been suspended. Please contact support.");

    public static readonly UserErrors AccountNotVerified =
        new("Please verify your email before logging in.");

    // ── Internal ──
    public static readonly UserErrors SaveFailed =
        new("An error occurred while saving the user. Please try again.");

    public static readonly UserErrors UpdateFailed =
        new("An error occurred while updating the user. Please try again.");

    public static readonly UserErrors DeleteFailed =
        new("An error occurred while deleting the user. Please try again.");

    public static readonly UserErrors FetchFailed =
        new("An error occurred while retrieving the user. Please try again.");
}