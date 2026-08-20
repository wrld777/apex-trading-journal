namespace Apex.Domain.Requests;

/// <summary>
/// Il corpo di <c>PUT /api/trade/{id}</c>.
/// </summary>
/// <remarks>
/// Ha esattamente la forma della create, e non per pigrizia: una PUT rimpiazza il
/// trade per intero, quindi il client rimanda il trade completo. Prima qui c'erano
/// solo i campi "del dopo" (uscita, note, tag): chi sbagliava a digitare il
/// lottaggio o il prezzo d'ingresso non aveva altra strada che cancellare il trade
/// e rifarlo. Tenendo un tipo distinto, e non riusando <see cref="CreateTradeRequest"/>
/// direttamente, restano separati i due endpoint nello Swagger e resta il posto dove
/// mettere un campo che valga solo per l'update.
/// </remarks>
public class UpdateTradeRequest : CreateTradeRequest
{
}
