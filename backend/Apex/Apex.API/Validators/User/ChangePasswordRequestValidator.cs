using Apex.Domain.Common;
using Apex.Domain.Request.User;
using FluentValidation;

namespace Apex.Domain.Validators;

public class ChangePasswordRequestValidator : AbstractValidator<ChangePasswordRequest>
{
    public ChangePasswordRequestValidator()
    {
        RuleFor(x => x.CurrentPassword)
            .NotEmpty().WithMessage(UserErrors.MissingCurrentPassword.Message);

        // Stessi requisiti che valgono alla registrazione: cambiare password non
        // deve essere una scorciatoia per indebolirla.
        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage(UserErrors.MissingPassword.Message)
            .MinimumLength(8).WithMessage(UserErrors.PasswordTooShort.Message)
            .Matches(@"[A-Z]").WithMessage(UserErrors.PasswordTooWeak.Message)
            .Matches(@"[0-9]").WithMessage(UserErrors.PasswordTooWeak.Message)
            .Matches(@"[^a-zA-Z0-9]").WithMessage(UserErrors.PasswordTooWeak.Message);
    }
}
