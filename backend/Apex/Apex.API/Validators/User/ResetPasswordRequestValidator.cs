using Apex.Domain.Common;
using Apex.Domain.Request.User;
using FluentValidation;

namespace Apex.Domain.Validators;

public class ResetPasswordRequestValidator : AbstractValidator<ResetPasswordRequest>
{
    public ResetPasswordRequestValidator()
    {
        RuleFor(x => x.Token)
            .NotEmpty().WithMessage(AuthErrors.ResetTokenInvalid.Message);

        // Gli stessi requisiti del cambio password: arrivare da un link via email
        // non è una ragione per accettare una password più debole.
        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage(UserErrors.MissingPassword.Message)
            .MinimumLength(8).WithMessage(UserErrors.PasswordTooShort.Message)
            .Matches(@"[A-Z]").WithMessage(UserErrors.PasswordTooWeak.Message)
            .Matches(@"[0-9]").WithMessage(UserErrors.PasswordTooWeak.Message)
            .Matches(@"[^a-zA-Z0-9]").WithMessage(UserErrors.PasswordTooWeak.Message);
    }
}
