using Apex.Domain.Common;
using Apex.Domain.Request.User;
using FluentValidation;

namespace Apex.Domain.Validators;

public class UpdateProfileRequestValidator : AbstractValidator<UpdateProfileRequest>
{
    public UpdateProfileRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage(UserErrors.MissingName.Message)
            .MaximumLength(100).WithMessage(UserErrors.NameTooLong.Message);

        RuleFor(x => x.Instrument)
            .NotEmpty().WithMessage(UserErrors.MissingInstrument.Message);

        RuleFor(x => x.AccountSize)
            .GreaterThan(0).WithMessage(UserErrors.InvalidAccountSize.Message);
    }
}
