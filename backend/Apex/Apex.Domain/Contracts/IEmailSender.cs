namespace Apex.Domain.Contracts;

/// <summary>
/// Spedire una email. Chi la chiama non sa se dietro c'è un server SMTP, un log
/// o niente — e soprattutto non deve fallire se la posta non parte.
/// </summary>
public interface IEmailSender
{
    Task SendAsync(string toAddress, string toName, string subject, string htmlBody, CancellationToken ct);
}
