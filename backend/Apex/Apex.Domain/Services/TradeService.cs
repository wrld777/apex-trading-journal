using AutoMapper;
using Apex.Domain.Common;
using Apex.Domain.Contracts;
using Apex.Domain.DTO;
using Apex.Domain.DTOs;
using Apex.Domain.Entities;
using Apex.Domain.Enums;
using Apex.Domain.Repositories;
using Apex.Domain.Request.Trade;

namespace Apex.Domain.Services;

public class TradeService : ITradeService
{
    private readonly ITradeRepository _tradeRepository;
    private readonly IStrategyRepository _strategyRepository;
    private readonly IInstrumentRepository _instrumentRepository;
    private readonly IMapper _mapper;

    public TradeService(
        ITradeRepository tradeRepository,
        IStrategyRepository strategyRepository,
        IInstrumentRepository instrumentRepository,
        IMapper mapper)
    {
        _tradeRepository = tradeRepository;
        _strategyRepository = strategyRepository;
        _instrumentRepository = instrumentRepository;
        _mapper = mapper;
    }

    public async Task<Result<PagedList<TradeDto>>> GetPagedAsync(Guid userId, TradeQuery query, CancellationToken ct)
    {

        query.Page = query.Page < 1 ? 1 : query.Page;
        query.PageSize = query.PageSize is < 1 or > 100 ? 25 : query.PageSize;

        var (items, total) = await _tradeRepository.GetPagedAsync(userId, query, ct);

        var result = new PagedList<TradeDto>
        {
            Items = _mapper.Map<List<TradeDto>>(items),
            Page = query.Page,
            PageSize = query.PageSize,
            Total = total
        };

        return Result<PagedList<TradeDto>>.Success(result);
    }

    public async Task<Result<TradeDto>> GetByIdAsync(Guid id, Guid userId, CancellationToken ct)
    {
        var trade = await _tradeRepository.GetByIdAsync(id, ct);
        if (trade is null || trade.UserId != userId)
            return Result<TradeDto>.Failure(Error.FromTradeError(TradeErrors.NotFound(id)));

        return Result<TradeDto>.Success(_mapper.Map<TradeDto>(trade));
    }

    public async Task<Result<TradeDto>> CreateAsync(TradeDto dto, Guid userId, CancellationToken ct)
    {
        var instrument = await _instrumentRepository.GetInstrumentByIdAsync(dto.InstrumentId, ct);
        if (instrument is null)
            return Result<TradeDto>.Failure(
                Error.FromTradeError(TradeErrors.InstrumentNotFound(dto.InstrumentId)));

        var trade = _mapper.Map<Trade>(dto);
        trade.Id = Guid.NewGuid();
        trade.UserId = userId;
        trade.InstrumentId = instrument.InstrumentId;
        // Navigation valorizzata con l'entità già tracciata: serve solo a far trovare
        // il Symbol al mapper nella response (EF non la reinserisce, ha già la chiave).
        trade.Instrument = instrument;

        var exits = BuildExits(trade, dto);
        if (!exits.IsSuccess)
            return Result<TradeDto>.Failure(exits.Error!);

        RecomputeFromExits(trade, instrument.PointValue);


        var applied = await ApplyStrategyAndChecks(trade, dto.StrategyId, dto.RuleChecks, userId, ct);
        if (!applied.IsSuccess)
            return Result<TradeDto>.Failure(applied.Error!);

        var created = await _tradeRepository.CreateAsync(trade, ct);
        return Result<TradeDto>.Success(_mapper.Map<TradeDto>(created));
    }

    public async Task<Result<TradeDto>> UpdateAsync(Guid id, TradeDto dto, Guid userId, CancellationToken ct)
    {
        var trade = await _tradeRepository.GetByIdAsync(id, ct);
        if (trade is null || trade.UserId != userId)
            return Result<TradeDto>.Failure(Error.NotFound(TradeErrors.NotFound(id).Message));

        // Lo strumento è modificabile come tutto il resto: si sbaglia a scegliere MNQ
        // al posto di NQ come si sbaglia una quantità, e il PointValue che ne deriva
        // cambia il PnL. Si ricarica solo se è davvero cambiato.
        var instrument = trade.Instrument;
        if (dto.InstrumentId != Guid.Empty && dto.InstrumentId != trade.InstrumentId)
        {
            var replacement = await _instrumentRepository.GetInstrumentByIdAsync(dto.InstrumentId, ct);
            if (replacement is null)
                return Result<TradeDto>.Failure(
                    Error.FromTradeError(TradeErrors.InstrumentNotFound(dto.InstrumentId)));

            instrument = replacement;
            trade.InstrumentId = replacement.InstrumentId;
            // Come in create: serve al mapper per il Symbol nella response.
            trade.Instrument = replacement;
        }

        // Una PUT rimpiazza il trade: si riscrive anche il "prima" (direzione, livelli,
        // size, orario d'ingresso), non solo il "dopo". Restano fuori solo Id, UserId,
        // CreatedAt e i campi derivati, che li ricalcola RecomputeFromExits.
        trade.Direction = dto.Direction;
        trade.EntryPrice = dto.EntryPrice;
        trade.StopLoss = dto.StopLoss;
        trade.TakeProfit = dto.TakeProfit;
        trade.Quantity = dto.Quantity;
        trade.EntryTime = dto.EntryTime;
        trade.Session = dto.Session;
        trade.Setup = dto.Setup;
        trade.HTFBias = dto.HTFBias;
        trade.Grade = dto.Grade;
        trade.ExitTime = dto.ExitTime;
        trade.Rationale = dto.Rationale;
        trade.EmotionalState = dto.EmotionalState;
        trade.Mistakes = dto.Mistakes;
        trade.MistakeTags = dto.MistakeTags;
        trade.Tags = dto.Tags;
        trade.Screenshots = dto.Screenshots;
        trade.UpdatedAt = DateTime.UtcNow;

        // Dopo i livelli, non prima: TP/SL/BE derivano il prezzo dai livelli appena
        // riscritti, e la quantità è quella nuova a dover tornare coi contratti.
        var exits = BuildExits(trade, dto);
        if (!exits.IsSuccess)
            return Result<TradeDto>.Failure(exits.Error!);

        RecomputeFromExits(trade, instrument.PointValue);

        // Riconcilia strategia + aderenza: replace totale dei rule check.
        var applied = await ApplyStrategyAndChecks(trade, dto.StrategyId, dto.RuleChecks, userId, ct);
        if (!applied.IsSuccess)
            return Result<TradeDto>.Failure(applied.Error!);

        var updated = await _tradeRepository.UpdateAsync(trade, ct);
        return Result<TradeDto>.Success(_mapper.Map<TradeDto>(updated));
    }

    public async Task<Result<bool>> DeleteAsync(Guid id, Guid userId, CancellationToken ct)
    {
        var trade = await _tradeRepository.GetByIdAsync(id, ct);
        if (trade is null || trade.UserId != userId)
            return Result<bool>.Failure(Error.FromTradeError(TradeErrors.NotFound(id)));

        await _tradeRepository.DeleteAsync(trade, ct);
        return Result<bool>.Success(true);
    }

    /* ── PRIVATE HELPERS ── */

    // Applica strategia + aderenza a un trade.
    // - StrategyId null/empty → trade senza strategia (nessun check).
    // - La strategia deve appartenere all'utente (altrimenti NotFound, come #68).
    // - Ogni rule check deve puntare a una regola DI QUELLA strategia.
    private async Task<Result<bool>> ApplyStrategyAndChecks(
        Trade trade, Guid? strategyId, List<TradeRuleCheckDto> checks, Guid userId, CancellationToken ct)
    {
        trade.RuleChecks.Clear();
        trade.StrategyId = null;

        if (strategyId is null || strategyId == Guid.Empty)
            return Result<bool>.Success(true);

        var strategy = await _strategyRepository.GetByIdAsync(strategyId.Value, userId, ct);
        if (strategy is null)
            return Result<bool>.Failure(Error.FromStrategyError(StrategyErrors.NotFound(strategyId.Value)));

        trade.StrategyId = strategy.Id;

        var validRuleIds = strategy.Rules.Select(r => r.Id).ToHashSet();
        foreach (var c in checks ?? new())
        {
            if (!validRuleIds.Contains(c.StrategyRuleId))
                return Result<bool>.Failure(
                    Error.Validation("Un rule check non appartiene alla strategia selezionata."));

            trade.RuleChecks.Add(new TradeRuleCheck
            {
                Id = Guid.NewGuid(),
                TradeId = trade.Id,
                StrategyRuleId = c.StrategyRuleId,
                Checked = c.Checked
            });
        }

        return Result<bool>.Success(true);
    }

    // Costruisce le uscite del trade (#96). Due forme accettate:
    // - dto.Exits valorizzata → parziali, la somma dei contratti deve coprire Quantity;
    // - altrimenti un'unica uscita su tutta la quantità, con l'esito indicato da
    //   dto.Outcome (default Manual, che è il comportamento pre-#96 su ExitPrice).
    // Il trade è chiuso per definizione: non esiste il caso "quantità residua aperta".
    private static Result<bool> BuildExits(Trade trade, TradeDto dto)
    {
        trade.Exits.Clear();

        var requested = dto.Exits is { Count: > 0 }
            ? dto.Exits
            : new List<TradeExitDto>
            {
                new()
                {
                    Outcome = dto.Outcome ?? TradeOutcome.Manual,
                    Price = dto.ExitPrice,
                    Contracts = trade.Quantity,
                    Time = dto.ExitTime,
                    Order = 0
                }
            };

        var order = 0;
        foreach (var e in requested)
        {
            if (e.Contracts <= 0)
                return Result<bool>.Failure(Error.FromTradeError(TradeErrors.InvalidExitContracts));

            var price = ResolveExitPrice(trade, e.Outcome, e.Price);
            if (price <= 0)
                return Result<bool>.Failure(Error.FromTradeError(TradeErrors.InvalidExitPrice));

            trade.Exits.Add(new TradeExit
            {
                Id = Guid.NewGuid(),
                TradeId = trade.Id,
                Outcome = e.Outcome,
                Price = price,
                Contracts = e.Contracts,
                // Senza orario sulla singola uscita si eredita quello del trade:
                // sui parziali serve solo se l'utente vuole distinguerli.
                Time = e.Time ?? trade.ExitTime,
                Order = order++
            });
        }

        var totalContracts = trade.Exits.Sum(x => x.Contracts);
        if (totalContracts != trade.Quantity)
            return Result<bool>.Failure(
                Error.FromTradeError(TradeErrors.ExitContractsMismatch(totalContracts, trade.Quantity)));

        return Result<bool>.Success(true);
    }

    // Il punto della #96: per TP/SL/BE il prezzo è già sul trade, si digita solo
    // sull'uscita manuale.
    private static decimal ResolveExitPrice(Trade trade, TradeOutcome outcome, decimal? manualPrice) =>
        outcome switch
        {
            TradeOutcome.TakeProfit => trade.TakeProfit,
            TradeOutcome.StopLoss => trade.StopLoss,
            TradeOutcome.BreakEven => trade.EntryPrice,
            _ => manualPrice ?? 0m
        };

    // ExitPrice, PnL, RR e Status derivano tutti dalle uscite: un solo punto in cui
    // si ricalcolano, chiamato sia in create che in update.
    private static void RecomputeFromExits(Trade trade, decimal pointValue)
    {
        trade.ExitPrice = CalculateWeightedExitPrice(trade);
        trade.PnL = CalculatePnL(trade, pointValue);
        trade.RiskReward = CalculateRR(trade);
        trade.Status = DetermineStatus(trade);
    }

    // Media dei prezzi di uscita pesata sui contratti: è il prezzo "equivalente"
    // del trade, usato da RR, stats ed export.
    private static decimal CalculateWeightedExitPrice(Trade trade)
    {
        var contracts = trade.Exits.Sum(e => e.Contracts);
        if (contracts == 0) return 0m;

        var weighted = trade.Exits.Sum(e => e.Price * e.Contracts);
        return Math.Round(weighted / contracts, 4);
    }

    // PnL in valuta, non in punti: senza il PointValue dello strumento un +10 su MNQ
    // e un +10 su NQ risulterebbero identici (#94). Dalla #96 è la somma delle uscite,
    // ognuna con i propri contratti. Sul risultato è equivalente a calcolarlo sul prezzo
    // medio ponderato — il PnL è lineare nel prezzo — ma tenerlo per uscita è ciò che
    // permette di leggere *come* si è chiuso il trade, e regge se un domani si
    // aggiungono commissioni per contratto.
    private static decimal CalculatePnL(Trade trade, decimal pointValue)
    {
        decimal total = 0m;
        foreach (var exit in trade.Exits)
        {
            var diff = trade.Direction == Direction.Long
                ? exit.Price - trade.EntryPrice
                : trade.EntryPrice - exit.Price;

            total += diff * exit.Contracts * pointValue;
        }

        return total;
    }

    private static decimal CalculateRR(Trade trade)
    {
        var risk = Math.Abs(trade.EntryPrice - trade.StopLoss);
        if (risk == 0) return 0;
        var reward = Math.Abs(trade.ExitPrice - trade.EntryPrice);
        return Math.Round(reward / risk, 2);
    }

    private static TradeStatus DetermineStatus(Trade trade)
    {
        return trade.PnL switch
        {
            > 0 => TradeStatus.Win,
            < 0 => TradeStatus.Loss,
            _ => TradeStatus.BreakEven
        };
    }
}