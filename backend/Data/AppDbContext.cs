using Microsoft.EntityFrameworkCore;
using backend.Entities;

namespace backend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) { }

        public DbSet<User> Users { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // citext makes every comparison and the unique index below case-insensitive,
            // so "Admin" cannot register alongside "admin" and login works either way.
            // Doing it in the column type keeps it true for queries nobody remembers to
            // wrap in ToLower().
            modelBuilder.HasPostgresExtension("citext");

            modelBuilder.Entity<User>(user =>
            {
                // citext replaces varchar(50), so the length cap becomes a check constraint.
                user.Property(u => u.Username).HasColumnType("citext").IsRequired();
                user.ToTable(t => t.HasCheckConstraint("CK_Users_Username_Length", "char_length(\"Username\") BETWEEN 3 AND 50"));

                // Email is citext for the same reason as Username: addresses are
                // treated case-insensitively in practice, so "A@b.com" must not be
                // able to register alongside "a@b.com".
                user.Property(u => u.Email).HasColumnType("citext").IsRequired();

                user.Property(u => u.PasswordHash).IsRequired();

                // The registration check alone cannot stop two concurrent signups.
                user.HasIndex(u => u.Username).IsUnique();
                user.HasIndex(u => u.Email).IsUnique();
            });
        }
    }
}
