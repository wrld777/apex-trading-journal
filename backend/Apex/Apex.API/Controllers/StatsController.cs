using Apex.Domain.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using System.Security.Claims;

namespace Apex.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StatsController : ControllerBase
    {
        private readonly IStatsService _statsService;

        public StatsController(IStatsService statsService )
        {
            _statsService = statsService;
            
        }

        // GET /api/stats?userId={userId}
        // GET /api/stats?userId={userId}&from={from}&to={to}
        [Authorize]
        [HttpGet]
        public async Task<IActionResult> GetStatsAsync([FromQuery] DateTime? from, [FromQuery] DateTime? to, [FromQuery] Guid? strategyId, CancellationToken ct)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized();

            if (strategyId.HasValue)
            {
                var stratResult = await _statsService.GetStatsByStrategyAsync(userId, strategyId.Value, ct);
                if (!stratResult.IsSuccess)
                    return BadRequest(stratResult.Error);
                return Ok(stratResult.Value);
            }

            if (from.HasValue && to.HasValue)
            {
                var rangeResult = await _statsService.GetStatsByDateRangeAsync(userId, from.Value, to.Value, ct);
                if (!rangeResult.IsSuccess)
                    return BadRequest(rangeResult.Error);
                return Ok(rangeResult.Value);
            }


            var result = await _statsService.GetStatsByUserAsync(userId, ct);
            if (!result.IsSuccess)
                return BadRequest(result.Error);
            return Ok(result.Value);
        }
    }
}
