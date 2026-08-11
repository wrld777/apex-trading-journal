using Apex.Domain.Common;
using System;
using System.Collections.Generic;
using System.Text;

namespace Apex.Domain.Common
{
    public class StrategyErrors
    {
        public string Message { get; }

        private StrategyErrors(string message)
        {
            Message = message;
        }
        public static StrategyErrors NotFound(Guid id) =>
            new($"Strategy with id '{id}' was not found.");

        public static StrategyErrors AlreadyExist(string name) =>
            new($"Strategy with name '{name}' already exists.");

        // ── Validation ──
        public static readonly StrategyErrors NameRequired =
            new("Strategy name is required.");

        public static readonly StrategyErrors NameTooLong =
            new("Strategy name must not exceed 100 characters.");

        public static readonly StrategyErrors RulesRequired =
            new("At least one rule is required.");

        public static readonly StrategyErrors RuleLabelRequired =
            new("Rule label is required.");

        public static StrategyErrors InstrumentNotFound(Guid id) =>
            new($"Instrument with id '{id}' was not found in the catalog.");
    }
}
