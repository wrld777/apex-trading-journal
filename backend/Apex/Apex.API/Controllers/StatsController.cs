using Apex.Domain.Contracts;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

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

        [HttpGet]
        public async Task<IActionResult> GetStatsAsyncù(
            [FromQuery] Guid userId,
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to,
            CancellationToken ct
            )
        {
            if(from.HasValue && to.HasValue)
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
