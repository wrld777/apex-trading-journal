using AutoMapper;
using Apex.Domain.Common;
using Apex.Domain.Contracts;
using Apex.Domain.DTOs;
using Apex.Domain.Entities;
using Apex.Domain.Enums;
using Apex.Domain.Repositories;

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

    public async Task<Result<List<TradeDto>>> GetAllAsync(Guid userId, CancellationToken ct)
    {
        var trades = await _tradeRepository.GetAllAsync(userId, ct);
        return Result<List<TradeDto>>.Success(_mapper.Map<List<TradeDto>>(trades));
    }

    public async Task<Result<TradeDto>> GetByIdAsync(Guid id, CancellationToken ct)
    {
        var trade = await _tradeRepository.GetByIdAsync(id, ct);
        if (trade is null)
            return Result<TradeDto>.Failure(Error.TradeNotFound(id));

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

    public async Task<Result<TradeDto>> UpdateAsync(Guid id, TradeDto dto, CancellationToken ct)
    {
        var trade = await _tradeRepository.GetByIdAsync(id, ct);
        if (trade is null)
            return Result<TradeDto>.Failure(Error.TradeNotFound(id));

        _mapper.Map(dto, trade);
        trade.PnL = CalculatePnL(trade);
        trade.RiskReward = CalculateRR(trade);
        trade.Status = DetermineStatus(trade);

        var updated = await _tradeRepository.UpdateAsync(trade, ct);
        return Result<TradeDto>.Success(_mapper.Map<TradeDto>(updated));
    }

    public async Task<Result<bool>> DeleteAsync(Guid id, CancellationToken ct)
    {
        var trade = await _tradeRepository.GetByIdAsync(id, ct);
        if (trade is null)
            return Result<bool>.Failure(Error.TradeNotFound(id));

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