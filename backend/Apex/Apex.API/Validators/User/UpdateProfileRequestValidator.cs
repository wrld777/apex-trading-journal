using Apex.Domain.Common;
using Apex.Domain.Request.User;
using FluentValidation;

namespace Apex.Domain.Validators;

public class UpdateProfileRequestValidator : AbstractValidator<UpdateProfileRequest>
{
    // L'immagine arriva come data URI: ridimensionata a 256×256 sta ampiamente
    // sotto, ma il limite va imposto anche qui — il client si può aggirare.
    private const int MaxAvatarChars = 400_000;

    public UpdateProfileRequestValidator()
    {
        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage(UserErrors.MissingFirstName.Message)
            .MaximumLength(100).WithMessage(UserErrors.FirstNameTooLong.Message);

        // Il cognome è facoltativo: si controlla solo la lunghezza.
        RuleFor(x => x.LastName)
            .MaximumLength(100).WithMessage(UserErrors.LastNameTooLong.Message);

        RuleFor(x => x.AvatarUrl)
            .MaximumLength(MaxAvatarChars).WithMessage(UserErrors.AvatarTooLarge.Message)
            .When(x => !string.IsNullOrEmpty(x.AvatarUrl));
    }
}
