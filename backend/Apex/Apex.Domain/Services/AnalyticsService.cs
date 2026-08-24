using Apex.Domain.Common;
using Apex.Domain.Contracts;
using Apex.Domain.DTO;
using Apex.Domain.Entities;
using Apex.Domain.Enums;
using Apex.Domain.Repositories;
using System;
using System.Collections.Generic;
using System.Text;

namespace Apex.Domain.Services
{
    public class AnalyticsService : IAnalyticsService
    {
        private readonly ITradeRepository _tradeRepository;
        private readonly IStrategyRepository _strategyRepository;

        public AnalyticsService(ITradeRepository tradeRepository, IStrategyRepository strategyRepository)
        {
            _tradeRepository = tradeRepository;
            _strategyRepository = strategyRepository;
        }



        public async Task<Result<List<StrategyStatsDto>>> GetStrategyStatsAsync(Guid userId, CancellationToken ct)
        {
            var trades = await _tradeRepository.GetForAnalyticsAsync(userId, null, null, null, ct);
            var result = trades
                .Where(t => t.StrategyId.HasValue)          
                .GroupBy(t => new { t.StrategyId, Name = t.Strategy!.Name })
                .Select(g =>
                {
                    var all = g.ToList();
                    var adherent = all.Where(IsFullyAdherent).ToList();
                    var notAdherent = all.Where(t => !IsFullyAdherent(t)).ToList();

                    return new StrategyStatsDto
                    {
                        StrategyId = g.Key.StrategyId!.Value,
                        StrategyName = g.Key.Name,
                        Overall = Metrics(all),
                        WhenFullyAdherent = Metrics(adherent),
                        WhenNotAdherent = Metrics(notAdherent)
                    };
                })
                .ToList();

            return Result<List<StrategyStatsDto>>.Success(result);
        }

        // Vista 3 — impatto della singola regola sul win rate (rispettata vs violata).
        public async Task<Result<List<RuleImpactDto>>> GetRuleImpactAsync(Guid userId, Guid strategyId, CancellationToken ct)
        {
            // ownership: GetByIdAsync filtra per userId, torna null se non è dell'utente.
            var strategy = await _strategyRepository.GetByIdAsync(strategyId, userId, ct);
            if (strategy is null)
                return Result<List<RuleImpactDto>>.Failure(
                    Error.FromStrategyError(StrategyErrors.NotFound(strategyId)));

            var trades = await _tradeRepository.GetForAnalyticsAsync(userId, strategyId, null, null, ct);

            // srotolo i trade nelle singole spunte, portandomi dietro l'esito del trade.
            var flat = trades.SelectMany(t => t.RuleChecks.Select(c => new
            {
                c.StrategyRuleId,
                c.StrategyRule.Label,
                c.Checked,
                IsWin = t.Status == TradeStatus.Win
            }));

            var result = flat
                .GroupBy(x => new { x.StrategyRuleId, x.Label })
                .Select(g =>
                {
                    var respected = g.Where(x => x.Checked).ToList();
                    var violated = g.Where(x => !x.Checked).ToList();
                    var wrResp = WinRate(respected.Count, respected.Count(x => x.IsWin));
                    var wrViol = WinRate(violated.Count, violated.Count(x => x.IsWin));

                    return new RuleImpactDto
                    {
                        StrategyRuleId = g.Key.StrategyRuleId,
                        Label = g.Key.Label,
                        TimesRespected = respected.Count,
                        TimesViolated = violated.Count,
                        WinRateRespected = wrResp,
                        WinRateViolated = wrViol,
                        Impact = wrResp - wrViol
                    };
                })
                .OrderByDescending(r => r.Impact)   // le più dannose se saltate in cima
                .ToList();

            return Result<List<RuleImpactDto>>.Success(result);
        }

        // Vista 4 — trend disciplina: media % di spunte per settimana/mese.
        public async Task<Result<List<DisciplinePointDto>>> GetDisciplineAsync(Guid userId, string granularity, CancellationToken ct)
        {
            var trades = await _tradeRepository.GetForAnalyticsAsync(userId, null, null, null, ct);

            var result = trades
                .Where(t => t.RuleChecks.Any())
                .GroupBy(t => PeriodStart(t.EntryTime, granularity))
                .Select(g => new DisciplinePointDto
                {
                    PeriodStart = g.Key,
                    AdherenceRate = Math.Round(
                        g.Average(t => (decimal)t.RuleChecks.Count(c => c.Checked) / t.RuleChecks.Count) * 100, 2),
                    TotalTrades = g.Count()
                })
                .OrderBy(p => p.PeriodStart)
                .ToList();

            return Result<List<DisciplinePointDto>>.Success(result);
        }

        // Vista 5 — mese per mese, per tutte le strategie o per una sola.
        // Il "come sta andando" non si legge dal cumulativo: un mese storto dentro
        // una curva che sale non si vede, e con una strategia sola il grafico
        // generale non c'entra nulla.
        public async Task<Result<List<MonthlyPerformanceDto>>> GetMonthlyAsync(Guid userId, Guid? strategyId, CancellationToken ct)
        {
            if (strategyId.HasValue)
            {
                // Stessa ownership del resto (#68): una strategia altrui non esiste.
                var strategy = await _strategyRepository.GetByIdAsync(strategyId.Value, userId, ct);
                if (strategy is null)
                    return Result<List<MonthlyPerformanceDto>>.Failure(
                        Error.FromStrategyError(StrategyErrors.NotFound(strategyId.Value)));
            }

            var trades = await _tradeRepository.GetForAnalyticsAsync(userId, strategyId, null, null, ct);

            var result = trades
                .GroupBy(t => new DateTime(t.EntryTime.Year, t.EntryTime.Month, 1, 0, 0, 0, DateTimeKind.Utc))
                .Select(g => new MonthlyPerformanceDto
                {
                    Month = g.Key,
                    NetPnL = Math.Round(g.Sum(t => t.PnL), 2),
                    Metrics = Metrics(g.ToList())
                })
                .OrderBy(m => m.Month)
                .ToList();

            return Result<List<MonthlyPerformanceDto>>.Success(result);
        }

        // ── Le cinque letture che dicono *perché* i numeri sono quelli ──────────
        // Le quattro viste precedenti dicono come va una strategia. Queste dicono
        // cosa fa chi la esegue: quali errori tornano, cosa succede dopo uno stop,
        // quanti trade sono troppi, se la size è costante. Tutte partono dallo
        // stesso elenco di trade, ordinato per orario d'ingresso.

        /// <summary>Vista 6 — quanto costa ogni errore etichettato.</summary>
        public async Task<Result<List<MistakeImpactDto>>> GetMistakeImpactAsync(Guid userId, CancellationToken ct)
        {
            var trades = await _tradeRepository.GetForAnalyticsAsync(userId, null, null, null, ct);
            return Result<List<MistakeImpactDto>>.Success(MistakeImpact(trades));
        }

        /// <summary>Vista 7 — come si va dopo una perdita.</summary>
        public async Task<Result<TiltDto>> GetTiltAsync(Guid userId, CancellationToken ct)
        {
            var trades = (await _tradeRepository.GetForAnalyticsAsync(userId, null, null, null, ct))
                .OrderBy(t => t.EntryTime)
                .ToList();

            var afterLoss = new List<Trade>();
            var afterWin = new List<Trade>();
            var gaps = new List<int>();

            // Si guarda la coppia, non il singolo trade: conta cos'era il
            // precedente, non com'è andato questo.
            for (var i = 1; i < trades.Count; i++)
            {
                var previous = trades[i - 1];
                if (previous.Status == TradeStatus.Loss)
                {
                    afterLoss.Add(trades[i]);
                    // Quanto ci si è messi a rientrare. Il riferimento è l'uscita
                    // del trade perso, non il suo ingresso: è da lì che parte la
                    // fretta.
                    var from = previous.ExitTime ?? previous.EntryTime;
                    gaps.Add((int)Math.Max(0, (trades[i].EntryTime - from).TotalMinutes));
                }
                else if (previous.Status == TradeStatus.Win)
                {
                    afterWin.Add(trades[i]);
                }
            }

            return Result<TiltDto>.Success(new TiltDto
            {
                AfterLoss = Metrics(afterLoss),
                AfterWin = Metrics(afterWin),
                Baseline = Metrics(trades),
                MedianMinutesAfterLoss = Median(gaps)
            });
        }

        /// <summary>Vista 8 — il primo, il secondo, il terzo trade della giornata.</summary>
        public async Task<Result<SequenceDto>> GetSequenceAsync(Guid userId, CancellationToken ct)
        {
            var trades = await _tradeRepository.GetForAnalyticsAsync(userId, null, null, null, ct);

            // Il giorno è quello dell'ingresso in UTC, com'è salvato: raggruppare
            // sull'ora locale sposterebbe i trade serali al giorno dopo.
            var byDay = trades
                .GroupBy(t => t.EntryTime.Date)
                .Select(g => g.OrderBy(t => t.EntryTime).ToList())
                .ToList();

            // Oltre il quarto i trade sono pochi e sparsi: tenerli separati
            // produrrebbe secchielli da un trade, che non dicono niente.
            const int LastBucket = 4;
            var buckets = new List<SequenceBucketDto>();
            for (var position = 1; position <= LastBucket; position++)
            {
                var inBucket = byDay
                    .SelectMany(day => day
                        .Select((t, index) => (Trade: t, Position: index + 1))
                        .Where(x => position == LastBucket ? x.Position >= LastBucket : x.Position == position)
                        .Select(x => x.Trade))
                    .ToList();

                if (inBucket.Count == 0) continue;

                buckets.Add(new SequenceBucketDto
                {
                    Position = position,
                    Label = position == LastBucket ? $"{LastBucket}th+" : Ordinal(position),
                    Metrics = Metrics(inBucket),
                    NetPnL = Math.Round(inBucket.Sum(t => t.PnL), 2)
                });
            }

            return Result<SequenceDto>.Success(new SequenceDto
            {
                Buckets = buckets,
                TradingDays = byDay.Count,
                AvgTradesPerDay = byDay.Count > 0 ? Math.Round((decimal)trades.Count / byDay.Count, 2) : 0,
                MaxTradesInADay = byDay.Count > 0 ? byDay.Max(d => d.Count) : 0
            });
        }

        /// <summary>Vista 9 — quanto varia il rischio da un trade all'altro.</summary>
        public async Task<Result<RiskConsistencyDto>> GetRiskConsistencyAsync(Guid userId, CancellationToken ct)
        {
            var trades = (await _tradeRepository.GetForAnalyticsAsync(userId, null, null, null, ct))
                .Where(t => t.InitialRisk > 0)          // stop sull'entry: rischio non definito
                .OrderBy(t => t.EntryTime)
                .ToList();

            if (trades.Count == 0)
                return Result<RiskConsistencyDto>.Success(new RiskConsistencyDto());

            var risks = trades.Select(t => t.InitialRisk).ToList();
            var mean = risks.Average();
            var variance = risks.Count > 1
                ? risks.Sum(r => (r - mean) * (r - mean)) / (risks.Count - 1)
                : 0m;
            var stdDev = (decimal)Math.Sqrt((double)variance);

            var sorted = risks.OrderBy(r => r).ToList();

            return Result<RiskConsistencyDto>.Success(new RiskConsistencyDto
            {
                TradesWithRisk = trades.Count,
                MedianRisk = Math.Round(sorted[sorted.Count / 2], 2),
                MinRisk = Math.Round(sorted.First(), 2),
                MaxRisk = Math.Round(sorted.Last(), 2),
                // Il coefficiente di variazione, non la deviazione secca: su size
                // diverse la stessa deviazione significa cose diverse.
                VariationPct = mean > 0 ? Math.Round(stdDev / mean * 100, 1) : 0,
                Points = trades.Select(t => new RiskPointDto
                {
                    Date = t.EntryTime,
                    Risk = Math.Round(t.InitialRisk, 2),
                    RMultiple = t.RMultiple
                }).ToList()
            });
        }

        /// <summary>Vista 10 — la settimana appena passata, accanto a quella prima.</summary>
        public async Task<Result<WeeklyReviewDto>> GetWeeklyReviewAsync(Guid userId, DateTime? weekStart, CancellationToken ct)
        {
            // La settimana comincia di lunedì: la domenica in mezzo spezzerebbe
            // in due ogni settimana di lavoro.
            var reference = weekStart ?? DateTime.UtcNow;
            var start = StartOfWeek(reference);
            var end = start.AddDays(7);
            var previousStart = start.AddDays(-7);

            var trades = await _tradeRepository.GetForAnalyticsAsync(userId, null, previousStart, end, ct);
            var thisWeek = trades.Where(t => t.EntryTime >= start && t.EntryTime < end).ToList();
            var lastWeek = trades.Where(t => t.EntryTime >= previousStart && t.EntryTime < start).ToList();

            // Le regole saltate, contate sulla singola spunta: una regola mancata
            // su sette trade è un'abitudine, su uno è una giornata storta.
            var slipped = thisWeek
                .SelectMany(t => t.RuleChecks.Select(c => new
                {
                    c.StrategyRule.Label,
                    Strategy = t.Strategy != null ? t.Strategy.Name : string.Empty,
                    c.Checked
                }))
                .GroupBy(x => new { x.Label, x.Strategy })
                .Select(g => new SlippedRuleDto
                {
                    Label = g.Key.Label,
                    StrategyName = g.Key.Strategy,
                    TimesSkipped = g.Count(x => !x.Checked),
                    TimesTotal = g.Count()
                })
                .Where(r => r.TimesSkipped > 0)
                .OrderByDescending(r => r.TimesSkipped)
                .ToList();

            return Result<WeeklyReviewDto>.Success(new WeeklyReviewDto
            {
                WeekStart = start,
                ThisWeek = Metrics(thisWeek),
                LastWeek = Metrics(lastWeek),
                NetPnL = Math.Round(thisWeek.Sum(t => t.PnL), 2),
                LastWeekNetPnL = Math.Round(lastWeek.Sum(t => t.PnL), 2),
                Adherence = Adherence(thisWeek),
                LastWeekAdherence = Adherence(lastWeek),
                SlippedRules = slipped,
                Mistakes = MistakeImpact(thisWeek),
                TradingDays = thisWeek.Select(t => t.EntryTime.Date).Distinct().Count()
            });
        }

        private static bool IsFullyAdherent(Trade t) =>
        t.RuleChecks.Any() && t.RuleChecks.All(c => c.Checked);

        // Errore standard della media: quanto l'expectancy calcolata può
        // discostarsi da quella vera, dato quanti trade la sostengono. Serve a
        // scrivere "±0,42R" accanto al numero invece di spacciare per assodato
        // ciò che è ancora rumore. Con meno di due trade non è definito.
        private static decimal StdErr(List<decimal> values)
        {
            if (values.Count < 2) return 0;

            var mean = values.Average();
            var variance = values.Sum(v => (v - mean) * (v - mean)) / (values.Count - 1);
            var stdDev = (decimal)Math.Sqrt((double)variance);
            return Math.Round(stdDev / (decimal)Math.Sqrt(values.Count), 2);
        }

        // Il costo di ogni etichetta d'errore. Il confronto è con i trade *senza*
        // quell'etichetta: il risultato dei trade sbagliati da solo non dice
        // niente — anche un trade con un errore può chiudere in guadagno.
        private static List<MistakeImpactDto> MistakeImpact(List<Trade> trades)
        {
            var tagged = trades.Where(t => t.MistakeTags.Count > 0).ToList();
            if (tagged.Count == 0) return new List<MistakeImpactDto>();

            return tagged
                .SelectMany(t => t.MistakeTags.Select(tag => (Tag: tag, Trade: t)))
                .GroupBy(x => x.Tag, StringComparer.OrdinalIgnoreCase)
                .Select(g =>
                {
                    var withTag = g.Select(x => x.Trade).ToList();
                    var withoutTag = trades.Where(t => !t.MistakeTags.Contains(g.Key, StringComparer.OrdinalIgnoreCase)).ToList();

                    return new MistakeImpactDto
                    {
                        Tag = g.Key,
                        Occurrences = withTag.Count,
                        NetR = Math.Round(withTag.Where(t => t.RMultiple.HasValue).Sum(t => t.RMultiple!.Value), 2),
                        NetPnL = Math.Round(withTag.Sum(t => t.PnL), 2),
                        WinRate = WinRate(withTag.Count, withTag.Count(t => t.Status == TradeStatus.Win)),
                        AvgRDelta = Math.Round(AvgR(withTag) - AvgR(withoutTag), 2)
                    };
                })
                .OrderBy(m => m.AvgRDelta)   // il più costoso in cima
                .ToList();
        }

        private static decimal AvgR(List<Trade> trades)
        {
            var withR = trades.Where(t => t.RMultiple.HasValue).ToList();
            return withR.Count > 0 ? withR.Average(t => t.RMultiple!.Value) : 0;
        }

        private static decimal Adherence(List<Trade> trades)
        {
            var withChecks = trades.Where(t => t.RuleChecks.Count > 0).ToList();
            if (withChecks.Count == 0) return 0;

            return Math.Round(
                withChecks.Average(t => (decimal)t.RuleChecks.Count(c => c.Checked) / t.RuleChecks.Count) * 100, 1);
        }

        private static int Median(List<int> values)
        {
            if (values.Count == 0) return 0;
            var sorted = values.OrderBy(v => v).ToList();
            return sorted[sorted.Count / 2];
        }

        private static DateTime StartOfWeek(DateTime date)
        {
            // DayOfWeek parte da domenica: la domenica va indietro di sei giorni,
            // non di zero, o la settimana comincerebbe il giorno in cui finisce.
            var daysFromMonday = ((int)date.DayOfWeek + 6) % 7;
            return DateTime.SpecifyKind(date.Date.AddDays(-daysFromMonday), DateTimeKind.Utc);
        }

        private static string Ordinal(int n) => n switch
        {
            1 => "1st",
            2 => "2nd",
            3 => "3rd",
            _ => $"{n}th"
        };

        private static decimal WinRate(int total, int wins) =>
            total > 0 ? Math.Round((decimal)wins / total * 100, 2) : 0;

        private static MetricsBlockDto Metrics(List<Trade> trades)
        {
            // I trade senza R definito (stop sull'entry) restano fuori dalle medie in R
            // ma continuano a contare in dollari.
            var withR = trades.Where(t => t.RMultiple.HasValue).ToList();
            var netR = withR.Sum(t => t.RMultiple!.Value);

            return new MetricsBlockDto
            {
                TotalTrades = trades.Count,
                WinRate = WinRate(trades.Count, trades.Count(t => t.Status == TradeStatus.Win)),
                Expectancy = trades.Count > 0 ? Math.Round(trades.Average(t => t.PnL), 2) : 0,
                ExpectancyR = withR.Count > 0 ? Math.Round(netR / withR.Count, 2) : 0,
                NetR = Math.Round(netR, 2),
                AvgRR = trades.Count > 0 ? Math.Round(trades.Average(t => t.RiskReward), 2) : 0,
                ExpectancyRStdErr = StdErr(withR.Select(t => t.RMultiple!.Value).ToList())
            };
        }

        private static DateTime PeriodStart(DateTime d, string granularity) =>
            granularity == "month"
                ? new DateTime(d.Year, d.Month, 1, 0, 0, 0, DateTimeKind.Utc)
                : d.Date.AddDays(-(int)d.DayOfWeek);   
    }
}
