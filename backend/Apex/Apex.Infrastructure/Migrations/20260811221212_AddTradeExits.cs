using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Apex.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTradeExits : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TradeExits",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TradeId = table.Column<Guid>(type: "uuid", nullable: false),
                    Outcome = table.Column<string>(type: "text", nullable: false),
                    Price = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    Contracts = table.Column<int>(type: "integer", nullable: false),
                    Time = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Order = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TradeExits", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TradeExits_Trades_TradeId",
                        column: x => x.TradeId,
                        principalTable: "Trades",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TradeExits_TradeId",
                table: "TradeExits",
                column: "TradeId");

            // Backfill (#96): ogni trade già registrato diventa un'uscita unica di tipo
            // Manual al prezzo che aveva. Deve stare qui e non in uno script a parte,
            // altrimenti resterebbero trade senza uscite e il PnL — che ora è la somma
            // delle uscite — verrebbe azzerato al primo update.
            migrationBuilder.Sql(@"
                INSERT INTO ""TradeExits"" (""Id"", ""TradeId"", ""Outcome"", ""Price"", ""Contracts"", ""Time"", ""Order"")
                SELECT gen_random_uuid(), t.""Id"", 'Manual', t.""ExitPrice"", t.""Quantity"", t.""ExitTime"", 0
                FROM ""Trades"" t
                WHERE NOT EXISTS (SELECT 1 FROM ""TradeExits"" e WHERE e.""TradeId"" = t.""Id"");
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TradeExits");
        }
    }
}
