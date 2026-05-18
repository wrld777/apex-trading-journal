using Apex.Domain.DTOs;

namespace Apex.Domain.Contracts;

public interface ITradeService
{
    Task<List<TradeDto>> GetAllAsync(Guid userId);
    Task<TradeDto?> GetByIdAsync(Guid id);
    Task<TradeDto> CreateAsync(TradeDto dto, Guid userId);
    Task<TradeDto> UpdateAsync(Guid id, TradeDto dto);
    Task DeleteAsync(Guid id);
}