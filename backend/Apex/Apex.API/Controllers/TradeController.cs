using Apex.Domain.Common;
using Apex.Domain.Contracts;
using Apex.Domain.DTOs;
using Apex.Domain.Requests;
using Apex.Domain.Responses;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;

namespace Apex.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TradeController : ControllerBase
{
    private readonly ITradeService _tradeService;
    private readonly IMapper _mapper;

    public TradeController(ITradeService tradeService, IMapper mapper)
    {
        _tradeService = tradeService;
        _mapper = mapper;
    }

    // GET /api/trade?userId={userId}
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid userId, CancellationToken ct)
    {
        var result = await _tradeService.GetAllAsync(userId, ct);
        if (!result.IsSuccess)
            return BadRequest(result.Error);

        return Ok(_mapper.Map<List<TradeResponse>>(result.Value));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await _tradeService.GetByIdAsync(id, ct);
        if (!result.IsSuccess)
            return NotFound(result.Error);

        return Ok(_mapper.Map<TradeResponse>(result.Value));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTradeRequest request, CancellationToken ct)
    {

        var userId = Guid.Parse("a0000000-0000-0000-0000-000000000001");

        var dto = _mapper.Map<TradeDto>(request);
        var result = await _tradeService.CreateAsync(dto, userId, ct);
        if (!result.IsSuccess)
            return BadRequest(result.Error);

        return CreatedAtAction(nameof(GetById),
            new { id = result.Value!.Id },
            _mapper.Map<TradeResponse>(result.Value));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateTradeRequest request, CancellationToken ct)
    {
        var dto = _mapper.Map<TradeDto>(request);
        var result = await _tradeService.UpdateAsync(id, dto, ct);
        if (!result.IsSuccess)
            return NotFound(result.Error);

        return Ok(_mapper.Map<TradeResponse>(result.Value));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var result = await _tradeService.DeleteAsync(id, ct);
        if (!result.IsSuccess)
            return NotFound(result.Error);

        return NoContent();
    }
}