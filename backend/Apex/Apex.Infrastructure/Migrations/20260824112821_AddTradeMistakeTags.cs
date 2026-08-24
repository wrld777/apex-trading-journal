using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Apex.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTradeMistakeTags : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // I trade che esistono già non hanno etichette d'errore, e la colonna
            // non è nullable: senza un default Postgres si ferma su ogni riga
            // esistente. Un array vuoto è esattamente ciò che significa "nessun
            // errore etichettato".
            migrationBuilder.AddColumn<List<string>>(
                name: "MistakeTags",
                table: "Trades",
                type: "text[]",
                nullable: false,
                defaultValueSql: "'{}'::text[]");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MistakeTags",
                table: "Trades");
        }
    }
}
