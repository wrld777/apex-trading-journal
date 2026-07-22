using System.Security.Claims;
using Apex.Domain.Contracts;
using Apex.Domain.DTOs;
using Apex.Domain.Requests;
using Apex.Domain.Responses;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Apex.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StrategyController : ControllerBase
{
    private readonly IStrategyService _strategyService;
    private readonly IMapper _mapper;

    public StrategyController(IStrategyService strategyService, IMapper mapper)
    {
        _strategyService = strategyService;
        _mapper = mapper;
    }

    // GET /api/strategy
    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized();

        var result = await _strategyService.GetAllAsync(userId, ct);
        if (!result.IsSuccess)
            return BadRequest(result.Error);

        return Ok(_mapper.Map<List<StrategyResponse>>(result.Value));
    }

    [Authorize]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized();

        var result = await _strategyService.GetByIdAsync(id, userId, ct);
        if (!result.IsSuccess)
            return NotFound(result.Error);

        return Ok(_mapper.Map<StrategyResponse>(result.Value));
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateStrategyRequest request, CancellationToken ct)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized();

        var dto = _mapper.Map<StrategyDto>(request);
        var result = await _strategyService.CreateAsync(dto, userId, ct);
        if (!result.IsSuccess)
            return BadRequest(result.Error);

        return CreatedAtAction(nameof(GetById),
            new { id = result.Value!.Id },
            _mapper.Map<StrategyResponse>(result.Value));
    }

    [Authorize]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateStrategyRequest request, CancellationToken ct)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized();

        var dto = _mapper.Map<StrategyDto>(request);
        var result = await _strategyService.UpdateAsync(id, dto, userId, ct);
        if (!result.IsSuccess)
            return NotFound(result.Error);

        return Ok(_mapper.Map<StrategyResponse>(result.Value));
    }

    [Authorize]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized();

        var result = await _strategyService.DeleteAsync(id, userId, ct);
        if (!result.IsSuccess)
            return NotFound(result.Error);

        return NoContent();
    }
}
