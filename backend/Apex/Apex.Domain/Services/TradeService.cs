using AutoMapper;
using Apex.Domain.Common;
using Apex.Domain.Contracts;
using Apex.Domain.DTOs;
using Apex.Domain.Entities;
using Apex.Domain.Enums;
using Apex.Domain.Repositories;
using Apex.Domain.Request.Trade;

namespace Apex.Domain.Services;

public class TradeService : ITradeService
{
    private readonly ITradeRepository _tradeRepository;
    private readonly IMapper _mapper;

    public TradeService(ITradeRepository tradeRepository, IMapper mapper)
    {
        _tradeRepository = tradeRepository;
        _mapper = mapper;
    }

    public async Task<Result<PagedList<TradeDto>>> GetPagedAsync(Guid userId, TradeQuery query, CancellationToken ct)
    {
        // clamp: il client non può chiedere pagine invalide o pageSize fuori scala
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
        var trade = _mapper.Map<Trade>(dto);
        trade.UserId = userId;
        trade.PnL = CalculatePnL(trade);
        trade.RiskReward = CalculateRR(trade);
        trade.Status = DetermineStatus(trade);

        var created = await _tradeRepository.CreateAsync(trade, ct);
        return Result<TradeDto>.Success(_mapper.Map<TradeDto>(created));
    }

    public async Task<Result<TradeDto>> UpdateAsync(Guid id, TradeDto dto, Guid userId, CancellationToken ct)
    {
        var trade = await _tradeRepository.GetByIdAsync(id, ct);
        if (trade is null || trade.UserId != userId)
            return Result<TradeDto>.Failure(Error.FromTradeError(TradeErrors.NotFound(id)));

        trade.ExitPrice = dto.ExitPrice;
        trade.ExitTime = dto.ExitTime;
        trade.Rationale = dto.Rationale;
        trade.EmotionalState = dto.EmotionalState;
        trade.Mistakes = dto.Mistakes;
        trade.Tags = dto.Tags;
        trade.Screenshots = dto.Screenshots;
        trade.PnL = CalculatePnL(trade);
        trade.RiskReward = CalculateRR(trade);
        trade.Status = DetermineStatus(trade);

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

    private static decimal CalculatePnL(Trade trade)
    {
        var diff = trade.Direction == Direction.Long
            ? trade.ExitPrice - trade.EntryPrice
            : trade.EntryPrice - trade.ExitPrice;

        return diff * trade.Quantity;
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