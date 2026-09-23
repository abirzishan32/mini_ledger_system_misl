using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddUserEmail : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Applied against an empty table. On a populated database the empty-string
            // default would give every existing row the same value and the unique index
            // below would fail; such a database needs a backfill between these two
            // statements before this migration can run.
            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "Users",
                type: "citext",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_Email",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Email",
                table: "Users");
        }
    }
}
