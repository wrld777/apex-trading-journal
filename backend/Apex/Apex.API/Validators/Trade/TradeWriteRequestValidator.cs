using Apex.Domain.Common;
using Apex.Domain.Enums;
using Apex.Domain.Requests;
using FluentValidation;

namespace Apex.Domain.Validators;

/// <summary>
/// Le regole valide per ogni scrittura di un trade, create e update insieme.
/// </summary>
/// <remarks>
/// Sta su un generico e non su <see cref="CreateTradeRequest"/> perché
/// FluentValidation risolve il validator sul tipo concreto: un
/// <c>AbstractValidator&lt;CreateTradeRequest&gt;</c> non verrebbe mai applicato a
/// una <see cref="UpdateTradeRequest"/>, per quanto ne erediti. Così le due
/// sottoclassi qui sotto sono vuote e le regole restano scritte una volta sola.
/// </remarks>
public abstract class TradeWriteRequestValidator<T> : AbstractValidator<T> where T : CreateTradeRequest
{
    protected TradeWriteRequestValidator()
    {
        RuleFor(x => x.InstrumentId)
            .NotEmpty().WithMessage(TradeErrors.MissingInstrument.Message);

        RuleFor(x => x.EntryPrice)
            .GreaterThan(0).WithMessage(TradeErrors.InvalidEntryPrice.Message);

        RuleFor(x => x.StopLoss)
            .GreaterThan(0).WithMessage(TradeErrors.InvalidStopLoss.Message)
            .NotEqual(x => x.EntryPrice).WithMessage(TradeErrors.InvalidRisk.Message);

        // Il take profit è opzionale nel form, quindi non può essere preteso sempre
        // (#98: un trade senza TP non era salvabile). Serve solo se lo si usa come
        // esito di un'uscita; se valorizzato deve comunque essere sensato.
        RuleFor(x => x.TakeProfit)
            .GreaterThan(0).WithMessage(TradeErrors.InvalidTakeProfit.Message)
            .When(x => x.TakeProfit != 0 || UsesOutcome(x, TradeOutcome.TakeProfit));

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

            // I controlli direzionali sul TP valgono solo se il TP c'è: senza,
            // il confronto con l'entry boccerebbe ogni trade privo di target (#98).
            if (request.TakeProfit != 0)
            {
                if (request.Direction == Domain.Enums.Direction.Long && request.TakeProfit <= request.EntryPrice)
                    context.AddFailure(TradeErrors.TakeProfitBelowEntryForLong.Message);

                if (request.Direction == Domain.Enums.Direction.Short && request.TakeProfit >= request.EntryPrice)
                    context.AddFailure(TradeErrors.TakeProfitAboveEntryForShort.Message);
            }

            // Un esito non si può derivare da un livello che non è stato indicato.
            if (UsesOutcome(request, TradeOutcome.TakeProfit) && request.TakeProfit <= 0)
                context.AddFailure(TradeErrors.TakeProfitRequiredForOutcome.Message);

            if (UsesOutcome(request, TradeOutcome.StopLoss) && request.StopLoss <= 0)
                context.AddFailure(TradeErrors.StopLossRequiredForOutcome.Message);

            // Uscite parziali (#96): il trade si registra sempre già chiuso, quindi
            // i contratti delle uscite devono coprire esattamente la quantità.
            if (request.Exits is { Count: > 0 })
            {
                if (request.Exits.Any(e => e.Contracts <= 0))
                    context.AddFailure(TradeErrors.InvalidExitContracts.Message);

                if (request.Exits.Any(e => e.Outcome == TradeOutcome.Manual && (e.Price ?? 0) <= 0))
                    context.AddFailure(TradeErrors.MissingManualExitPrice.Message);

                var total = request.Exits.Sum(e => e.Contracts);
                if (total != request.Quantity)
                    context.AddFailure(TradeErrors.ExitContractsMismatch(total, request.Quantity).Message);
            }
            else if ((request.Outcome ?? TradeOutcome.Manual) == TradeOutcome.Manual && request.ExitPrice <= 0)
            {
                // Caso semplice senza esito dichiarato: si ricade sull'uscita manuale,
                // che il prezzo ce l'ha solo se lo si scrive.
                context.AddFailure(TradeErrors.MissingManualExitPrice.Message);
            }
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

    // Vero se l'esito è usato da almeno un'uscita, sia nella forma a parziali che
    // nell'esito singolo.
    private static bool UsesOutcome(T request, TradeOutcome outcome) =>
        request.Exits is { Count: > 0 }
            ? request.Exits.Any(e => e.Outcome == outcome)
            : request.Outcome == outcome;

    private static bool NoDuplicateRules(List<Domain.DTO.TradeRuleCheckDto> checks)
    {
        if (checks is null || checks.Count == 0) return true;
        return checks.Select(c => c.StrategyRuleId).Distinct().Count() == checks.Count;
    }

    private static bool BeHttpUrl(string url) =>
    Uri.TryCreate(url, UriKind.Absolute, out var uri) &&
    (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
}

public class CreateTradeRequestValidator : TradeWriteRequestValidator<CreateTradeRequest>
{
}

public class UpdateTradeRequestValidator : TradeWriteRequestValidator<UpdateTradeRequest>
{
}
