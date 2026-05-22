namespace Apex.Domain.Common;

public class Error
{
    public string Code { get; init; }
    public string Message { get; init; }

    // ── Generic ──
    public static Error NotFound(string message) => new() { Code = "NOT_FOUND", Message = message };
    public static Error Validation(string message) => new() { Code = "VALIDATION", Message = message };
    public static Error Unauthorized(string message) => new() { Code = "UNAUTHORIZED", Message = message };
    public static Error Forbidden(string message) => new() { Code = "FORBIDDEN", Message = message };
    public static Error Internal(string message) => new() { Code = "INTERNAL", Message = message };
    public static Error Conflict(string message) => new() { Code = "CONFLICT", Message = message };

    // ── From Error Classes ──
    public static Error FromTradeError(TradeErrors error) => new() { Code = "TRADE_ERROR", Message = error.Message };
    public static Error FromUserError(UserErrors error) => new() { Code = "USER_ERROR", Message = error.Message };
    public static Error FromAuthError(AuthErrors error) => new() { Code = "AUTH_ERROR", Message = error.Message };
}