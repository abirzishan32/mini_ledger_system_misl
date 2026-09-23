using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class HashRefreshToken : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "RefreshToken",
                table: "Users",
                newName: "RefreshTokenHash");

            // The renamed column still holds plaintext tokens from before this change.
            // Clear them so nothing readable survives; users simply log in again.
            migrationBuilder.Sql(@"UPDATE ""Users"" SET ""RefreshTokenHash"" = NULL, ""RefreshTokenExpiryTime"" = NULL;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "RefreshTokenHash",
                table: "Users",
                newName: "RefreshToken");
        }
    }
}
