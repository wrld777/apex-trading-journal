namespace Apex.Domain.Entities;

/// <summary>
/// Come si spedisce la posta. Sezione <c>Email</c> di appsettings.
/// </summary>
public class EmailSettings
{
    /// <summary>
    /// Con <c>false</c> le email non partono: vengono scritte nel log e basta.
    /// È il valore giusto in sviluppo, e l'unico modo di lavorare senza un
    /// server SMTP a portata di mano.
    /// </summary>
    public bool Enabled { get; set; }

    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FromAddress { get; set; } = string.Empty;
    public string FromName { get; set; } = "Rubric";

    /// <summary>
    /// L'indirizzo pubblico del frontend: è la base dei link nelle email, e in
    /// produzione non è indovinabile dal backend.
    /// </summary>
    public string AppBaseUrl { get; set; } = "http://localhost:5173";

    /// <summary>
    /// Avvisare a ogni accesso. Su un'app usata ogni giorno diventa rumore, per
    /// questo si può spegnere senza toccare il codice.
    /// </summary>
    public bool NotifyOnLogin { get; set; } = true;

    /// Quanto vale un link di reimpostazione.
    public int ResetTokenValidMinutes { get; set; } = 60;
}
