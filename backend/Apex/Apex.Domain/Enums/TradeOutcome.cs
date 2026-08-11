namespace Apex.Domain.Enums;

// Come si è chiusa un'uscita (#96). Chi compila ragiona per esito, non per prezzo:
// TakeProfit/StopLoss/BreakEven derivano il prezzo dai livelli già presenti sul trade,
// Manual è l'unico caso in cui il prezzo va digitato.
public enum TradeOutcome
{
    TakeProfit,
    StopLoss,
    BreakEven,
    Manual
}
