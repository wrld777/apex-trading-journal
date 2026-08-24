using Apex.Domain.Contracts;
using Apex.Domain.Entities;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using MimeKit;

namespace Apex.Infrastructure.Email;

/// <summary>
/// L'invio vero, via SMTP.
/// </summary>
/// <remarks>
/// Non solleva mai: una email che non parte non deve trasformare una
/// registrazione riuscita in un errore per chi si è appena iscritto. Il guasto
/// finisce nel log, dove lo si può vedere, e la richiesta prosegue.
///
/// Con <c>Email:Enabled = false</c> il messaggio viene solo registrato: è il
/// modo di lavorare in sviluppo senza un server di posta, e nei log si legge
/// comunque il link di reimpostazione.
/// </remarks>
public class SmtpEmailSender : IEmailSender
{
    private readonly EmailSettings _settings;
    private readonly ILogger<SmtpEmailSender> _logger;

    public SmtpEmailSender(EmailSettings settings, ILogger<SmtpEmailSender> logger)
    {
        _settings = settings;
        _logger = logger;
    }

    public async Task SendAsync(string toAddress, string toName, string subject, string htmlBody, CancellationToken ct)
    {
        if (!_settings.Enabled)
        {
            _logger.LogInformation(
                "Email non spedita (Email:Enabled = false) — a: {To}, oggetto: {Subject}\n{Body}",
                toAddress, subject, htmlBody);
            return;
        }

        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_settings.FromName, _settings.FromAddress));
            message.To.Add(new MailboxAddress(toName, toAddress));
            message.Subject = subject;
            message.Body = new BodyBuilder { HtmlBody = htmlBody }.ToMessageBody();

            using var client = new SmtpClient();
            // 465 parla TLS dal primo byte; 587 parte in chiaro e sale con STARTTLS.
            // Sbagliare i due casi è il modo classico di restare appesi in attesa.
            var security = _settings.Port == 465
                ? SecureSocketOptions.SslOnConnect
                : SecureSocketOptions.StartTls;

            await client.ConnectAsync(_settings.Host, _settings.Port, security, ct);
            if (!string.IsNullOrWhiteSpace(_settings.Username))
                await client.AuthenticateAsync(_settings.Username, _settings.Password, ct);

            await client.SendAsync(message, ct);
            await client.DisconnectAsync(true, ct);

            _logger.LogInformation("Email spedita a {To}: {Subject}", toAddress, subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Invio email fallito — a: {To}, oggetto: {Subject}", toAddress, subject);
        }
    }
}
