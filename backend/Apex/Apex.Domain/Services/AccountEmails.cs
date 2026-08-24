using System.Globalization;

namespace Apex.Domain.Services;

/// <summary>
/// Il testo delle email dell'account.
/// </summary>
/// <remarks>
/// HTML scritto a mano e volutamente povero: niente CSS esterno, niente flexbox,
/// niente immagini remote. I client di posta ne supportano una frazione, e una
/// email che arriva storta è peggio di una email semplice. Lo stile sta inline
/// per la stessa ragione — Gmail elimina i <c>&lt;style&gt;</c> nel corpo.
/// </remarks>
public static class AccountEmails
{
    private const string Bg = "#0f1115";
    private const string Panel = "#161a21";
    private const string Text = "#e7eaf0";
    private const string Muted = "#9aa3b2";
    private const string Brand = "#6ee7b7";

    public static (string Subject, string Html) Welcome(string firstName, string appBaseUrl) =>
    (
        "Welcome to Rubric",
        Wrap($"""
            <h1 style="margin:0 0 16px;font-size:20px;color:{Text};">Welcome, {Escape(firstName)}.</h1>
            <p style="margin:0 0 14px;">
              Rubric measures a strategy against its own checklist of rules — so you can tell
              a weak strategy from an undisciplined execution of a good one.
            </p>
            <p style="margin:0 0 20px;">
              Start by writing down a strategy and its entry rules. Every trade you log against
              it records which rules you actually followed, and that is what the analytics read.
            </p>
            {Button("Open Rubric", appBaseUrl)}
            """)
    );

    public static (string Subject, string Html) PasswordReset(string firstName, string resetUrl, int validMinutes) =>
    (
        "Reset your Rubric password",
        Wrap($"""
            <h1 style="margin:0 0 16px;font-size:20px;color:{Text};">Reset your password</h1>
            <p style="margin:0 0 14px;">
              Hi {Escape(firstName)} — use the button below to choose a new password. The link works
              once and expires in {validMinutes} minutes.
            </p>
            {Button("Choose a new password", resetUrl)}
            <p style="margin:20px 0 0;color:{Muted};font-size:13px;">
              If you did not ask for this, ignore this email: your password stays as it is.
            </p>
            """)
    );

    public static (string Subject, string Html) NewSignIn(string firstName, DateTime whenUtc) =>
    (
        "New sign-in to your Rubric account",
        Wrap($"""
            <h1 style="margin:0 0 16px;font-size:20px;color:{Text};">New sign-in</h1>
            <p style="margin:0 0 14px;">
              Hi {Escape(firstName)} — your account was accessed on
              <strong>{whenUtc.ToString("dd MMM yyyy 'at' HH:mm 'UTC'", CultureInfo.InvariantCulture)}</strong>.
            </p>
            <p style="margin:0;color:{Muted};font-size:13px;">
              Was it you? Then there is nothing to do. If not, change your password now.
            </p>
            """)
    );

    private static string Button(string label, string url) => $"""
        <a href="{url}" style="display:inline-block;background:{Brand};color:#06231a;text-decoration:none;
           padding:11px 18px;border-radius:8px;font-weight:600;font-size:14px;">{label}</a>
        <p style="margin:14px 0 0;color:{Muted};font-size:12px;word-break:break-all;">{url}</p>
        """;

    // Il link in chiaro sotto al bottone non è ridondanza: parecchi client
    // rendono i bottoni inerti, e senza l'indirizzo scritto non resta nulla da
    // fare a chi ha ricevuto l'email.
    private static string Wrap(string body) => $"""
        <div style="background:{Bg};padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
          <div style="max-width:520px;margin:0 auto;background:{Panel};border:1px solid #232a34;border-radius:12px;padding:28px;color:{Text};font-size:15px;line-height:1.6;">
            <div style="font-size:13px;letter-spacing:0.14em;text-transform:uppercase;color:{Muted};margin-bottom:22px;">Rubric</div>
            {body}
          </div>
          <div style="max-width:520px;margin:16px auto 0;color:{Muted};font-size:12px;text-align:center;">
            Rubric — a trading journal that measures a strategy against its own rules.
          </div>
        </div>
        """;

    private static string Escape(string s) =>
        s.Replace("&", "&amp;").Replace("<", "&lt;").Replace(">", "&gt;");
}
