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

        // GET /api/analytics/mistakes — quanto costa ogni errore etichettato.
        [HttpGet("mistakes")]
        public async Task<IActionResult> GetMistakes(CancellationToken ct)
        {
            if (!TryGetUserId(out var userId))
                return Unauthorized();

            var result = await _analyticsService.GetMistakeImpactAsync(userId, ct);
            return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
        }

        // GET /api/analytics/tilt — come si va dopo una perdita.
        [HttpGet("tilt")]
        public async Task<IActionResult> GetTilt(CancellationToken ct)
        {
            if (!TryGetUserId(out var userId))
                return Unauthorized();

            var result = await _analyticsService.GetTiltAsync(userId, ct);
            return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
        }

        // GET /api/analytics/sequence — primo, secondo, terzo trade della giornata.
        [HttpGet("sequence")]
        public async Task<IActionResult> GetSequence(CancellationToken ct)
        {
            if (!TryGetUserId(out var userId))
                return Unauthorized();

            var result = await _analyticsService.GetSequenceAsync(userId, ct);
            return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
        }

        // GET /api/analytics/risk — quanto varia il rischio fra un trade e l'altro.
        [HttpGet("risk")]
        public async Task<IActionResult> GetRisk(CancellationToken ct)
        {
            if (!TryGetUserId(out var userId))
                return Unauthorized();

            var result = await _analyticsService.GetRiskConsistencyAsync(userId, ct);
            return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
        }

        // GET /api/analytics/weekly?weekStart= — la revisione della settimana.
        [HttpGet("weekly")]
        public async Task<IActionResult> GetWeekly([FromQuery] DateTime? weekStart, CancellationToken ct)
        {
            if (!TryGetUserId(out var userId))
                return Unauthorized();

            var result = await _analyticsService.GetWeeklyReviewAsync(userId, weekStart, ct);
            return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
        }

        private bool TryGetUserId(out Guid userId)
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(claim, out userId);
        }
    }
}
