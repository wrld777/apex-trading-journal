using Apex.Domain.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Apex.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AnalyticsController : ControllerBase
    {
        private readonly IAnalyticsService _analyticsService;

        public AnalyticsController(IAnalyticsService analyticsService)
        {
            _analyticsService = analyticsService;
        }

        // GET /api/analytics/strategies
        [HttpGet("strategies")]
        public async Task<IActionResult> GetStrategyStats(CancellationToken ct)
        {
            if (!TryGetUserId(out var userId))
                return Unauthorized();

            var result = await _analyticsService.GetStrategyStatsAsync(userId, ct);
            return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
        }

        // GET /api/analytics/strategies/{id}/rules
        [HttpGet("strategies/{id}/rules")]
        public async Task<IActionResult> GetRuleImpact(Guid id, CancellationToken ct)
        {
            if (!TryGetUserId(out var userId))
                return Unauthorized();

            var result = await _analyticsService.GetRuleImpactAsync(userId, id, ct);
            return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
        }

        // GET /api/analytics/discipline?granularity=week|month
        [HttpGet("discipline")]
        public async Task<IActionResult> GetDiscipline([FromQuery] string? granularity, CancellationToken ct)
        {
            if (!TryGetUserId(out var userId))
                return Unauthorized();

            var g = string.IsNullOrWhiteSpace(granularity) ? "week" : granularity.ToLowerInvariant();
            var result = await _analyticsService.GetDisciplineAsync(userId, g, ct);
            return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
        }

        // GET /api/analytics/monthly?strategyId=
        [HttpGet("monthly")]
        public async Task<IActionResult> GetMonthly([FromQuery] Guid? strategyId, CancellationToken ct)
        {
            if (!TryGetUserId(out var userId))
                return Unauthorized();

            var result = await _analyticsService.GetMonthlyAsync(userId, strategyId, ct);
            return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
        }

        private bool TryGetUserId(out Guid userId)
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(claim, out userId);
        }
    }
}
