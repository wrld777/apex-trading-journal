using Apex.Domain.Common;
using Apex.Domain.Requests;
using FluentValidation;

namespace Apex.Domain.Validators;

public class CreateStrategyRequestValidator : AbstractValidator<CreateStrategyRequest>
{
    public CreateStrategyRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage(StrategyErrors.NameRequired.Message)
            .MaximumLength(100).WithMessage(StrategyErrors.NameTooLong.Message);

        RuleFor(x => x.Rules)
            .NotEmpty().WithMessage(StrategyErrors.RulesRequired.Message);

        RuleForEach(x => x.Rules).ChildRules(rule =>
        {
            rule.RuleFor(r => r.Label)
                .NotEmpty().WithMessage(StrategyErrors.RuleLabelRequired.Message);
        });
    }
}
