using System.Security.Claims;
using Apex.Domain.Common;
using Apex.Domain.Contracts;
using Apex.Domain.DTOs;
using Apex.Domain.Request.Trade;
using Apex.Domain.Requests;
using Apex.Domain.Responses;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
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


    // GET /api/trade?from=&to=&symbol=&setup=&session=&direction=&status=&page=&pageSize=&sort=&sortDir=
    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] TradeQuery query, CancellationToken ct)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized();

        var result = await _tradeService.GetPagedAsync(userId, query, ct);
        if (!result.IsSuccess)
            return BadRequest(result.Error);

        var paged = result.Value!;
        var response = new PagedList<TradeResponse>
        {
            Items = _mapper.Map<List<TradeResponse>>(paged.Items),
            Page = paged.Page,
            PageSize = paged.PageSize,
            Total = paged.Total
        };

        return Ok(response);
    }

    [Authorize]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized();

        var result = await _tradeService.GetByIdAsync(id, userId, ct);
        if (!result.IsSuccess)
            return NotFound(result.Error);

        return Ok(_mapper.Map<TradeResponse>(result.Value));
    }


    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTradeRequest request, CancellationToken ct)
    {

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized();

        var dto = _mapper.Map<TradeDto>(request);
        var result = await _tradeService.CreateAsync(dto, userId, ct);
        if (!result.IsSuccess)
            return BadRequest(result.Error);

        return CreatedAtAction(nameof(GetById),
            new { id = result.Value!.Id },
            _mapper.Map<TradeResponse>(result.Value));
    }


    [Authorize]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateTradeRequest request, CancellationToken ct)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized();

        var dto = _mapper.Map<TradeDto>(request);
        var result = await _tradeService.UpdateAsync(id, dto, userId, ct);
        if (!result.IsSuccess)
            // Da quando la PUT accetta il trade intero, qui non arriva più solo
            // "non esiste": contratti che non tornano, strumento inesistente, una
            // regola di un'altra strategia. Rispondere 404 a tutto direbbe al client
            // la cosa sbagliata.
            return result.Error!.Code == "NOT_FOUND"
                ? NotFound(result.Error)
                : BadRequest(result.Error);

        return Ok(_mapper.Map<TradeResponse>(result.Value));
    }

    [Authorize]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized();

        var result = await _tradeService.DeleteAsync(id, userId, ct);
        if (!result.IsSuccess)
            return NotFound(result.Error);

        return NoContent();
    }
}