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
    private readonly IInstrumentRepository _instrumentRepository;
    private readonly IMapper _mapper;

    public StrategyService(
        IStrategyRepository strategyRepository,
        IInstrumentRepository instrumentRepository,
        IMapper mapper)
    {
        _strategyRepository = strategyRepository;
        _instrumentRepository = instrumentRepository;
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

        var applied = await ApplyInstruments(strategy, dto.InstrumentIds, ct);
        if (!applied.IsSuccess)
            return Result<StrategyDto>.Failure(applied.Error!);

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

        var rules = await ApplyRules(strategy, dto.Rules, ct);
        if (!rules.IsSuccess)
            return Result<StrategyDto>.Failure(rules.Error!);

        var applied = await ApplyInstruments(strategy, dto.InstrumentIds, ct);
        if (!applied.IsSuccess)
            return Result<StrategyDto>.Failure(applied.Error!);

        var updated = await _strategyRepository.UpdateAsync(strategy, ct);
        return Result<StrategyDto>.Success(_mapper.Map<StrategyDto>(updated));
    }

    public async Task<Result<bool>> DeleteAsync(Guid id, Guid userId, CancellationToken ct)
    {
        var strategy = await _strategyRepository.GetByIdAsync(id, userId, ct);
        if (strategy is null)
            return Result<bool>.Failure(Error.FromStrategyError(StrategyErrors.NotFound(id)));

        // Cancellare la strategia porterebbe via le sue regole (cascade), ma l'aderenza
        // registrata sui trade le referenzia con FK Restrict: senza questo controllo si
        // otterrebbe un 500 da DbUpdateException invece di una spiegazione.
        var inUse = await _strategyRepository.GetRuleIdsInUseAsync(
            strategy.Rules.Select(r => r.Id).ToList(), ct);

        if (inUse.Count > 0)
            return Result<bool>.Failure(Error.FromStrategyError(StrategyErrors.StrategyInUse(strategy.Name)));

        await _strategyRepository.DeleteAsync(strategy, ct);
        return Result<bool>.Success(true);
    }

    // Le regole si aggiornano SUL POSTO, non si sostituiscono. Ricrearle a ogni salvataggio
    // — com'era prima — dava due problemi: l'aderenza già registrata sui trade
    // (TradeRuleCheck, FK Restrict) faceva fallire la DELETE con DbUpdateException, e
    // anche senza quel vincolo gli id nuovi avrebbero staccato lo storico dalle analytics
    // per regola. Chi non tocca le regole non deve subire nulla di tutto questo.
    private async Task<Result<bool>> ApplyRules(
        Strategy strategy, List<StrategyRuleDto> rules, CancellationToken ct)
    {
        var incoming = rules ?? new();
        var existing = strategy.Rules.ToDictionary(r => r.Id);

        var kept = incoming
            .Where(r => r.Id != Guid.Empty && existing.ContainsKey(r.Id))
            .Select(r => r.Id)
            .ToHashSet();

        var removed = strategy.Rules.Where(r => !kept.Contains(r.Id)).ToList();

        // Una regola già usata non si può togliere senza cancellare l'aderenza storica,
        // che è il dato per cui la feature esiste (ADR 0003): meglio un errore leggibile
        // che una violazione di FK o una perdita silenziosa.
        if (removed.Count > 0)
        {
            var inUse = await _strategyRepository.GetRuleIdsInUseAsync(
                removed.Select(r => r.Id).ToList(), ct);

            if (inUse.Count > 0)
            {
                var labels = string.Join(", ", removed.Where(r => inUse.Contains(r.Id)).Select(r => $"\"{r.Label}\""));
                return Result<bool>.Failure(
                    Error.FromStrategyError(StrategyErrors.RuleInUse(labels)));
            }
        }

        foreach (var rule in removed)
            strategy.Rules.Remove(rule);

        // L'ordine lo detta la posizione nella lista ricevuta, non il campo Order del
        // client: è già così che il form lo intende.
        var order = 0;
        foreach (var dto in incoming)
        {
            if (dto.Id != Guid.Empty && existing.TryGetValue(dto.Id, out var rule))
            {
                rule.Label = dto.Label;
                rule.Order = order++;
                rule.Required = dto.Required;
            }
            else
            {
                // Id volutamente NON assegnato (l'entità lo inizializzerebbe da sé):
                // dentro un grafo già tracciato EF considera "esistente" ogni entità
                // con la chiave valorizzata e tenterebbe un UPDATE su una riga che non
                // c'è — DbUpdateConcurrencyException, 0 righe toccate. Con la chiave
                // vuota la riconosce come nuova e genera lei il Guid.
                strategy.Rules.Add(new StrategyRule
                {
                    Id = Guid.Empty,
                    Label = dto.Label,
                    Order = order++,
                    Required = dto.Required,
                    StrategyId = strategy.Id
                });
            }
        }

        return Result<bool>.Success(true);
    }

    // Replace totale degli strumenti associati, stesso schema dei rule check sui trade.
    // Gli Instrument NON si costruiscono: si caricano dal catalogo globale (seed, non
    // modificabile dall'utente) e si agganciano tracciati, così EF scrive solo le righe
    // di join. Il caricamento serve anche a validare: un id fuori catalogo deve dare 400,
    // non una violazione di FK a valle.
    private async Task<Result<bool>> ApplyInstruments(
        Strategy strategy, List<Guid> instrumentIds, CancellationToken ct)
    {
        strategy.Instruments.Clear();

        var requested = (instrumentIds ?? new()).Distinct().ToList();
        if (requested.Count == 0)
            return Result<bool>.Success(true);

        var instruments = await _instrumentRepository.GetByIdsAsync(requested, ct);

        var found = instruments.Select(i => i.InstrumentId).ToHashSet();
        var missing = requested.Where(id => !found.Contains(id)).ToList();
        if (missing.Count > 0)
            return Result<bool>.Failure(
                Error.FromStrategyError(StrategyErrors.InstrumentNotFound(missing[0])));

        strategy.Instruments.AddRange(instruments);
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
