namespace Apex.Domain.Common;

public class TradeErrors
{
    public string Message { get; }

    private TradeErrors(string message)
    {
        Message = message;
    }

    // ── Not Found ──
    public static TradeErrors NotFound(Guid id) =>
        new($"Trade with id '{id}' was not found.");

    // ── Authorization ──
    public static readonly TradeErrors Unauthorized =
        new("You are not authorized to access this trade.");

    public static readonly TradeErrors Forbidden =
        new("You do not have permission to perform this action on the trade.");

    // ── Validation ──
    public static readonly TradeErrors InvalidUrl =
        new("Link not valid.");
    public static readonly TradeErrors InvalidRisk =
        new("Stop loss must be different from entry price.");

    public static readonly TradeErrors InvalidExitPrice =
        new("Exit price must be greater than 0.");

    public static readonly TradeErrors InvalidExitContracts =
        new("Each exit must close at least 1 contract.");

    public static TradeErrors ExitContractsMismatch(int total, int quantity) =>
        new($"Exits close {total} contracts but the trade has {quantity}: a trade is always recorded already closed.");

    public static readonly TradeErrors MissingManualExitPrice =
        new("A manual exit requires its own price.");

    public static readonly TradeErrors TakeProfitRequiredForOutcome =
        new("Take profit is required when an exit is taken at target.");

    public static readonly TradeErrors StopLossRequiredForOutcome =
        new("Stop loss is required when an exit is taken at stop.");

    public static readonly TradeErrors InvalidEntryPrice =
        new("Entry price must be greater than 0.");

    public static readonly TradeErrors InvalidQuantity =
        new("Quantity must be at least 1.");

    public static readonly TradeErrors InvalidEntryTime =
        new("Entry time is required.");

    public static readonly TradeErrors MissingExitTime =
        new("ExitTime is required.");

    public static readonly TradeErrors ExitTimeBeforeEntry =
        new("Exit time cannot be before entry time.");

    public static readonly TradeErrors InvalidStopLoss =
        new("Stop loss must be greater than 0.");

    public static readonly TradeErrors InvalidTakeProfit =
        new("Take profit must be greater than 0.");

    public static readonly TradeErrors MissingInstrument =
        new("Instrument is required.");

    public static TradeErrors InstrumentNotFound(Guid id) =>
        new($"Instrument with id '{id}' was not found.");

    public static readonly TradeErrors MissingSession =
        new("Session is required.");

    public static readonly TradeErrors MissingSetup =
        new("Setup is required.");

    public static readonly TradeErrors DuplicateTrade =
        new("A trade with the same entry time and symbol already exists.");

    // ── Business Rules ──
    public static readonly TradeErrors AlreadyClosed =
        new("This trade has already been closed.");

    public static readonly TradeErrors CannotDeleteClosedTrade =
        new("A closed trade cannot be deleted.");

    public static readonly TradeErrors StopLossAboveEntryForLong =
        new("Stop loss must be below entry price for a Long trade.");

    public static readonly TradeErrors StopLossBelowEntryForShort =
        new("Stop loss must be above entry price for a Short trade.");

    public static readonly TradeErrors TakeProfitBelowEntryForLong =
        new("Take profit must be above entry price for a Long trade.");

    public static readonly TradeErrors TakeProfitAboveEntryForShort =
        new("Take profit must be below entry price for a Short trade.");

    public static readonly TradeErrors RiskTooHigh =
        new("Risk exceeds the maximum allowed percentage of account size.");

    // ── Screenshot ──
    public static readonly TradeErrors ScreenshotNotFound =
        new("The specified screenshot was not found.");

    public static readonly TradeErrors ScreenshotLimitReached =
        new("Maximum number of screenshots (5) has been reached.");

    public static readonly TradeErrors InvalidScreenshotFormat =
        new("Screenshot must be PNG, JPG or WebP format.");

    public static readonly TradeErrors ScreenshotTooLarge =
        new("Screenshot file size must not exceed 10MB.");

    // ── Internal ──
    public static readonly TradeErrors SaveFailed =
        new("An error occurred while saving the trade. Please try again.");

    public static readonly TradeErrors DeleteFailed =
        new("An error occurred while deleting the trade. Please try again.");

    public static readonly TradeErrors UpdateFailed =
        new("An error occurred while updating the trade. Please try again.");

    public static readonly TradeErrors FetchFailed =
        new("An error occurred while retrieving trades. Please try again.");
}