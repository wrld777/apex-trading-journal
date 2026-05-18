
using Apex.Domain.Requests;
using FluentValidation;

namespace Apex.API.Validators;

public class CreateTradeRequestValidator : AbstractValidator<CreateTradeRequest>
{
    public CreateTradeRequestValidator()
    {
        RuleFor(x => x.Symbol)
            .NotEmpty().WithMessage("Symbol is required.")
            .MaximumLength(10).WithMessage("Symbol must not exceed 10 characters.");

        RuleFor(x => x.EntryPrice)
            .GreaterThan(0).WithMessage("Entry price must be greater than 0.");

        RuleFor(x => x.StopLoss)
            .GreaterThan(0).WithMessage("Stop loss must be greater than 0.")
            .NotEqual(x => x.EntryPrice).WithMessage("Stop loss must differ from entry price.");

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Quantity must be at least 1.");

        RuleFor(x => x.EntryTime)
            .NotEmpty().WithMessage("Entry time is required.");

        RuleFor(x => x.Session)
            .NotEmpty().WithMessage("Session is required.");

        RuleFor(x => x.Setup)
            .NotEmpty().WithMessage("Setup is required.");
    }
}