using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Apex.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class TradeRule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "StrategyId",
                table: "Trades",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "TradeRuleChecks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TradeId = table.Column<Guid>(type: "uuid", nullable: false),
                    StrategyRuleId = table.Column<Guid>(type: "uuid", nullable: false),
                    Checked = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TradeRuleChecks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TradeRuleChecks_StrategyRules_StrategyRuleId",
                        column: x => x.StrategyRuleId,
                        principalTable: "StrategyRules",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TradeRuleChecks_Trades_TradeId",
                        column: x => x.TradeId,
                        principalTable: "Trades",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Trades_StrategyId",
                table: "Trades",
                column: "StrategyId");

            migrationBuilder.CreateIndex(
                name: "IX_TradeRuleChecks_StrategyRuleId",
                table: "TradeRuleChecks",
                column: "StrategyRuleId");

            migrationBuilder.CreateIndex(
                name: "IX_TradeRuleChecks_TradeId",
                table: "TradeRuleChecks",
                column: "TradeId");

            migrationBuilder.AddForeignKey(
                name: "FK_Trades_Strategies_StrategyId",
                table: "Trades",
                column: "StrategyId",
                principalTable: "Strategies",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Trades_Strategies_StrategyId",
                table: "Trades");

            migrationBuilder.DropTable(
                name: "TradeRuleChecks");

            migrationBuilder.DropIndex(
                name: "IX_Trades_StrategyId",
                table: "Trades");

            migrationBuilder.DropColumn(
                name: "StrategyId",
                table: "Trades");
        }
    }
}
