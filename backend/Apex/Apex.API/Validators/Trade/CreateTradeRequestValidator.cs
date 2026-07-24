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

        // ExitTime è opzionale: un trade può essere loggato ancora aperto.
        // Se valorizzato, non può precedere l'entry.
        RuleFor(x => x.ExitTime!.Value)
            .GreaterThanOrEqualTo(x => x.EntryTime).WithMessage(TradeErrors.ExitTimeBeforeEntry.Message)
            .When(x => x.ExitTime.HasValue);

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

        // L'aderenza serve a registrare anche le regole NON rispettate: una regola
        // Required non spuntata NON blocca il salvataggio (è il dato che vogliamo).
        // Qui (stateless) impediamo solo check duplicati sulla stessa regola; l'appartenenza
        // dei check alla strategia e l'ownership sono validate nel TradeService.
        RuleFor(x => x.RuleChecks)
            .Must(NoDuplicateRules)
            .WithMessage("Rule check duplicati sulla stessa regola.");
    }

    private static bool NoDuplicateRules(List<Domain.DTO.TradeRuleCheckDto> checks)
    {
        if (checks is null || checks.Count == 0) return true;
        return checks.Select(c => c.StrategyRuleId).Distinct().Count() == checks.Count;
    }

    private static bool BeHttpUrl(string url) =>
    Uri.TryCreate(url, UriKind.Absolute, out var uri) &&
    (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
}