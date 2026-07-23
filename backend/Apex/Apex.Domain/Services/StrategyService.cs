using Apex.Domain.Common;
using Apex.Domain.Contracts;
using Apex.Domain.DTOs;
using Apex.Domain.Entities;
using Apex.Domain.Repositories;
using AutoMapper;

namespace Apex.Domain.Services;

public class StrategyService : IStrategyService
{
    private readonly IStrategyRepository _strategyRepository;
    private readonly IMapper _mapper;

    public StrategyService(IStrategyRepository strategyRepository, IMapper mapper)
    {
        _strategyRepository = strategyRepository;
        _mapper = mapper;
    }

    public async Task<Result<List<StrategyDto>>> GetAllAsync(Guid userId, CancellationToken ct)
    {
        var strategies = await _strategyRepository.GetAllStrategiesAsync(userId, ct);
        return Result<List<StrategyDto>>.Success(_mapper.Map<List<StrategyDto>>(strategies));
    }

    public async Task<Result<StrategyDto>> GetByIdAsync(Guid id, Guid userId, CancellationToken ct)
    {
        var strategy = await _strategyRepository.GetByIdAsync(id, userId, ct);
        if (strategy is null)
            return Result<StrategyDto>.Failure(Error.FromStrategyError(StrategyErrors.NotFound(id)));

        return Result<StrategyDto>.Success(_mapper.Map<StrategyDto>(strategy));
    }

    public async Task<Result<StrategyDto>> CreateAsync(StrategyDto dto, Guid userId, CancellationToken ct)
    {
        var existing = await _strategyRepository.GetByNameAsync(dto.Name, userId, ct);
        if (existing is not null)
            return Result<StrategyDto>.Failure(Error.FromStrategyError(StrategyErrors.AlreadyExist(dto.Name)));

        var strategy = _mapper.Map<Strategy>(dto);
        strategy.Id = Guid.NewGuid();
        strategy.UserId = userId;
        NormalizeRules(strategy);

        var created = await _strategyRepository.CreateAsync(strategy, ct);
        return Result<StrategyDto>.Success(_mapper.Map<StrategyDto>(created));
    }

    public async Task<Result<StrategyDto>> UpdateAsync(Guid id, StrategyDto dto, Guid userId, CancellationToken ct)
    {
        var strategy = await _strategyRepository.GetByIdAsync(id, userId, ct);
        if (strategy is null)
            return Result<StrategyDto>.Failure(Error.FromStrategyError(StrategyErrors.NotFound(id)));


        var byName = await _strategyRepository.GetByNameAsync(dto.Name, userId, ct);
        if (byName is not null && byName.Id != id)
            return Result<StrategyDto>.Failure(Error.FromStrategyError(StrategyErrors.AlreadyExist(dto.Name)));

        strategy.Name = dto.Name;
        strategy.Description = dto.Description;

        strategy.Rules.Clear();
        foreach (var rule in dto.Rules)
        {
            strategy.Rules.Add(new StrategyRule
            {
                Id = Guid.NewGuid(),
                Label = rule.Label,
                Order = rule.Order,
                Required = rule.Required,
                StrategyId = strategy.Id
            });
        }

        var updated = await _strategyRepository.UpdateAsync(strategy, ct);
        return Result<StrategyDto>.Success(_mapper.Map<StrategyDto>(updated));
    }

    public async Task<Result<bool>> DeleteAsync(Guid id, Guid userId, CancellationToken ct)
    {
        var strategy = await _strategyRepository.GetByIdAsync(id, userId, ct);
        if (strategy is null)
            return Result<bool>.Failure(Error.FromStrategyError(StrategyErrors.NotFound(id)));

        await _strategyRepository.DeleteAsync(strategy, ct);
        return Result<bool>.Success(true);
    }

    private static void NormalizeRules(Strategy strategy)
    {
        foreach (var rule in strategy.Rules)
        {
            rule.Id = Guid.NewGuid();
            rule.StrategyId = strategy.Id;
        }
    }
}
