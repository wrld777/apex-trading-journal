using static System.Runtime.InteropServices.JavaScript.JSType;

namespace Apex.Domain.Common;

public class Result<T>
{
    public bool IsSuccess { get; private set; }
    public T? Value { get; private set; }
    public Error? Error { get; private set; }

    private Result(T value)
    {
        IsSuccess = true;
        Value = value;
    }

    private Result(Error error)
    {
        IsSuccess = false;
        Error = error;
    }

    public static Result<T> Success(T value) => new(value);
    public static Result<T> Failure(Error error) => new(error);
}

public class Error
{
    public string Code { get; }
    public string Message { get; }

    private Error(string code, string message)
    {
        Code = code;
        Message = message;
    }

    // ── Generic ──
    public static Error NotFound(string message) => new("NOT_FOUND", message);
    public static Error Validation(string message) => new("VALIDATION", message);
    public static Error Unauthorized(string message) => new("UNAUTHORIZED", message);
    public static Error Internal(string message) => new("INTERNAL", message);

    // ── Trade ──
    public static Error TradeNotFound(Guid id) =>
        NotFound($"Trade with id '{id}' was not found.");

    public static readonly Error TradeUnauthorized =
        Unauthorized("You are not authorized to access this trade.");

    public static readonly Error TradeInvalidRisk =
        Validation("Stop loss must be different from entry price.");

    // ── User ──
    public static Error UserNotFound(Guid id) =>
        NotFound($"User with id '{id}' was not found.");

    public static Error UserEmailAlreadyExists(string email) =>
        Validation($"Email '{email}' is already in use.");

    public static readonly Error UserInvalidCredentials =
        Unauthorized("Invalid email or password.");
}