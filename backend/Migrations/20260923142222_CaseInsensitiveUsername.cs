using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class CaseInsensitiveUsername : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:PostgresExtension:citext", ",,");

            migrationBuilder.AlterColumn<string>(
                name: "Username",
                table: "Users",
                type: "citext",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50);

            migrationBuilder.AddCheckConstraint(
                name: "CK_Users_Username_Length",
                table: "Users",
                sql: "char_length(\"Username\") BETWEEN 3 AND 50");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_Users_Username_Length",
                table: "Users");

            migrationBuilder.AlterDatabase()
                .OldAnnotation("Npgsql:PostgresExtension:citext", ",,");

            migrationBuilder.AlterColumn<string>(
                name: "Username",
                table: "Users",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "citext");
        }
    }
}
