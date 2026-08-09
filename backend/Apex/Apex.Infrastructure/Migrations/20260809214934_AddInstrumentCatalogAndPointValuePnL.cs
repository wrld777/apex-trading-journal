using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Apex.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddInstrumentCatalogAndPointValuePnL : Migration
    {
        /// <inheritdoc />
        // ── Ordine riscritto a mano rispetto allo scaffold di EF ───────────────────────
        // EF droppava "Symbol" per primo e riempiva "InstrumentId" con Guid.Empty: così
        // si perdeva la mappatura e la FK sarebbe stata violata. Qui invece:
        //   catalogo → colonna nullable → backfill dal Symbol → ricalcolo PnL →
        //   guard → NOT NULL → drop Symbol → FK.
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Instruments",
                columns: table => new
                {
                    InstrumentId = table.Column<Guid>(type: "uuid", nullable: false),
                    Symbol = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    InstrumentName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PointValue = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    TickSize = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    TickValue = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    Currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    Type = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Instruments", x => x.InstrumentId);
                });

            migrationBuilder.InsertData(
                table: "Instruments",
                columns: new[] { "InstrumentId", "Currency", "InstrumentName", "PointValue", "Symbol", "TickSize", "TickValue", "Type" },
                values: new object[,]
                {
                    { new Guid("a1000000-0000-0000-0000-000000000001"), "USD", "E-mini S&P 500", 50m, "ES", 0.25m, 12.50m, "Future" },
                    { new Guid("a1000000-0000-0000-0000-000000000002"), "USD", "Micro E-mini S&P 500", 5m, "MES", 0.25m, 1.25m, "Future" },
                    { new Guid("a1000000-0000-0000-0000-000000000003"), "USD", "E-mini Nasdaq-100", 20m, "NQ", 0.25m, 5.00m, "Future" },
                    { new Guid("a1000000-0000-0000-0000-000000000004"), "USD", "Micro E-mini Nasdaq-100", 2m, "MNQ", 0.25m, 0.50m, "Future" },
                    { new Guid("a1000000-0000-0000-0000-000000000005"), "USD", "E-mini Dow ($5)", 5m, "YM", 1m, 5.00m, "Future" },
                    { new Guid("a1000000-0000-0000-0000-000000000006"), "USD", "Micro E-mini Dow", 0.50m, "MYM", 1m, 0.50m, "Future" },
                    { new Guid("a1000000-0000-0000-0000-000000000007"), "USD", "E-mini Russell 2000", 50m, "RTY", 0.10m, 5.00m, "Future" },
                    { new Guid("a1000000-0000-0000-0000-000000000008"), "USD", "Micro E-mini Russell 2000", 5m, "M2K", 0.10m, 0.50m, "Future" },
                    { new Guid("a1000000-0000-0000-0000-000000000009"), "USD", "Gold", 100m, "GC", 0.10m, 10.00m, "Future" },
                    { new Guid("a1000000-0000-0000-0000-000000000010"), "USD", "Micro Gold", 10m, "MGC", 0.10m, 1.00m, "Future" },
                    { new Guid("a1000000-0000-0000-0000-000000000011"), "USD", "Crude Oil", 1000m, "CL", 0.01m, 10.00m, "Future" },
                    { new Guid("a1000000-0000-0000-0000-000000000012"), "USD", "Micro Crude Oil", 100m, "MCL", 0.01m, 1.00m, "Future" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Instruments_Symbol",
                table: "Instruments",
                column: "Symbol",
                unique: true);

            // Nullable durante il backfill: i trade esistenti non hanno ancora uno strumento.
            migrationBuilder.AddColumn<Guid>(
                name: "InstrumentId",
                table: "Trades",
                type: "uuid",
                nullable: true);

            // Backfill: il vecchio Symbol testo libero → riga del catalogo.
            migrationBuilder.Sql("""
                UPDATE "Trades" t
                SET "InstrumentId" = i."InstrumentId"
                FROM "Instruments" i
                WHERE UPPER(TRIM(t."Symbol")) = i."Symbol";
                """);

            // Guard: se un simbolo non è nel catalogo si ferma qui, invece di lasciare
            // dati muti o di far esplodere la FK con un messaggio incomprensibile.
            migrationBuilder.Sql("""
                DO $$
                DECLARE orfani text;
                BEGIN
                    SELECT string_agg(DISTINCT "Symbol", ', ')
                    INTO orfani
                    FROM "Trades"
                    WHERE "InstrumentId" IS NULL;

                    IF orfani IS NOT NULL THEN
                        RAISE EXCEPTION
                            'Backfill #94 interrotto: simboli non presenti nel catalogo Instruments: %', orfani;
                    END IF;
                END $$;
                """);

            // Ricalcolo del PnL con il moltiplicatore di contratto (il bug della #94):
            // i valori esistenti erano in punti × contratti, non in valuta.
            // Status non cambia (PointValue è positivo, il segno resta) e RiskReward è un
            // rapporto in cui il moltiplicatore si semplifica.
            migrationBuilder.Sql("""
                UPDATE "Trades" t
                SET "PnL" = (
                    CASE WHEN t."Direction" = 'Long'
                         THEN t."ExitPrice" - t."EntryPrice"
                         ELSE t."EntryPrice" - t."ExitPrice"
                    END
                ) * t."Quantity" * i."PointValue"
                FROM "Instruments" i
                WHERE i."InstrumentId" = t."InstrumentId";
                """);

            migrationBuilder.AlterColumn<Guid>(
                name: "InstrumentId",
                table: "Trades",
                type: "uuid",
                nullable: false);

            migrationBuilder.DropColumn(
                name: "Symbol",
                table: "Trades");

            migrationBuilder.CreateIndex(
                name: "IX_Trades_InstrumentId",
                table: "Trades",
                column: "InstrumentId");

            migrationBuilder.AddForeignKey(
                name: "FK_Trades_Instruments_InstrumentId",
                table: "Trades",
                column: "InstrumentId",
                principalTable: "Instruments",
                principalColumn: "InstrumentId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        // Anche il Down è riscritto: prima ricostruisce Symbol dal catalogo e riporta il
        // PnL in punti, poi smonta. Invertendo l'ordine si perderebbero entrambi.
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Symbol",
                table: "Trades",
                type: "character varying(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "");

            migrationBuilder.Sql("""
                UPDATE "Trades" t
                SET "Symbol" = i."Symbol"
                FROM "Instruments" i
                WHERE i."InstrumentId" = t."InstrumentId";
                """);

            migrationBuilder.Sql("""
                UPDATE "Trades" t
                SET "PnL" = t."PnL" / i."PointValue"
                FROM "Instruments" i
                WHERE i."InstrumentId" = t."InstrumentId"
                  AND i."PointValue" <> 0;
                """);

            migrationBuilder.DropForeignKey(
                name: "FK_Trades_Instruments_InstrumentId",
                table: "Trades");

            migrationBuilder.DropIndex(
                name: "IX_Trades_InstrumentId",
                table: "Trades");

            migrationBuilder.DropColumn(
                name: "InstrumentId",
                table: "Trades");

            migrationBuilder.DropTable(
                name: "Instruments");
        }
    }
}
