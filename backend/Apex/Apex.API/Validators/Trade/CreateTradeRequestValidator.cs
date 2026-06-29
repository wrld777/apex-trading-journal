using Apex.Domain.Common;
using Apex.Domain.Requests;
using FluentValidation;

namespace Apex.Domain.Validators;

public class CreateTradeRequestValidator : AbstractValidator<CreateTradeRequest>
{
    public CreateTradeRequestValidator()
    {
        RuleFor(x => x.Symbol)
            .NotEmpty().WithMessage(TradeErrors.MissingSymbol.Message)
            .MaximumLength(10).WithMessage(TradeErrors.SymbolTooLong.Message);

        RuleFor(x => x.EntryPrice)
            .GreaterThan(0).WithMessage(TradeErrors.InvalidEntryPrice.Message);

        RuleFor(x => x.StopLoss)
            .GreaterThan(0).WithMessage(TradeErrors.InvalidStopLoss.Message)
            .NotEqual(x => x.EntryPrice).WithMessage(TradeErrors.InvalidRisk.Message);

        RuleFor(x => x.TakeProfit)
            .GreaterThan(0).WithMessage(TradeErrors.InvalidTakeProfit.Message);

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage(TradeErrors.InvalidQuantity.Message);

        RuleFor(x => x.EntryTime)
            .NotEmpty().WithMessage(TradeErrors.InvalidEntryTime.Message);

        RuleFor(x => x.ExitTime)
            .NotEmpty().WithMessage(TradeErrors.MissingExitTime.Message)
            .GreaterThanOrEqualTo(x => x.EntryTime).WithMessage(TradeErrors.ExitTimeBeforeEntry.Message);

        RuleFor(x => x.Session)
            .NotEmpty().WithMessage(TradeErrors.MissingSession.Message);

        RuleFor(x => x.Setup)
            .NotEmpty().WithMessage(TradeErrors.MissingSetup.Message);

        RuleFor(x => x).Custom((request, context) =>
        {
            if (request.Direction == Domain.Enums.Direction.Long && request.StopLoss >= request.EntryPrice)
                context.AddFailure(TradeErrors.StopLossAboveEntryForLong.Message);

            if (request.Direction == Domain.Enums.Direction.Short && request.StopLoss <= request.EntryPrice)
                context.AddFailure(TradeErrors.StopLossBelowEntryForShort.Message);

            if (request.Direction == Domain.Enums.Direction.Long && request.TakeProfit <= request.EntryPrice)
                context.AddFailure(TradeErrors.TakeProfitBelowEntryForLong.Message);

            if (request.Direction == Domain.Enums.Direction.Short && request.TakeProfit >= request.EntryPrice)
                context.AddFailure(TradeErrors.TakeProfitAboveEntryForShort.Message);
        });

        RuleForEach(x => x.Screenshots).Must(BeHttpUrl)
            .WithMessage(TradeErrors.InvalidUrl.Message);
    }

    private static bool BeHttpUrl(string url) =>
    Uri.TryCreate(url, UriKind.Absolute, out var uri) &&
    (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
}