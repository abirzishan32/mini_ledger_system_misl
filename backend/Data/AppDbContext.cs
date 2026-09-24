using Microsoft.EntityFrameworkCore;
using backend.Entities;

namespace backend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) { }

        public DbSet<User> Users { get; set; } = null!;
        public DbSet<Account> Accounts { get; set; } = null!;
        public DbSet<Transaction> Transactions { get; set; } = null!;
        public DbSet<Entry> Entries { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

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

            modelBuilder.Entity<Account>(account =>
            {
                account.Property(a => a.Name).HasColumnType("citext").IsRequired();
                account.ToTable(t => t.HasCheckConstraint(
                    "CK_Accounts_Name_Length", "char_length(\"Name\") BETWEEN 1 AND 100"));

                // Stored as text, not an int. Reordering the enum would otherwise
                // silently reinterpret every existing row, and the table stays readable.
                account.Property(a => a.Type).HasConversion<string>().HasMaxLength(20).IsRequired();

                account.HasOne<User>()
                    .WithMany()
                    .HasForeignKey(a => a.OwnerId)
                    .OnDelete(DeleteBehavior.Cascade);

                // One "Cash" per owner. Case-insensitive via citext, and enforced here
                // rather than by a pre-insert check, which two concurrent requests can
                // both pass.
                account.HasIndex(a => new { a.OwnerId, a.Name }).IsUnique();
            });

            modelBuilder.Entity<Transaction>(transaction =>
            {
                transaction.Property(t => t.Description).HasMaxLength(200).IsRequired();
                transaction.Property(t => t.Reference).HasMaxLength(100);
                transaction.Property(t => t.IdempotencyKey).HasMaxLength(100);

                transaction.HasOne<User>()
                    .WithMany()
                    .HasForeignKey(t => t.OwnerId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Partial unique index: the constraint applies only to rows that set a
                // key, so the many transactions without one do not collide.
                transaction.HasIndex(t => new { t.OwnerId, t.IdempotencyKey })
                    .IsUnique()
                    .HasFilter("\"IdempotencyKey\" IS NOT NULL");

                // The ordering every listing and running balance uses.
                transaction.HasIndex(t => new { t.OwnerId, t.OccurredAt, t.CreatedAt });
            });

            modelBuilder.Entity<Entry>(entry =>
            {
                // Money is decimal, never float: binary floating point cannot represent
                // 0.1 exactly, and the error compounds across a ledger.
                entry.Property(e => e.Amount).HasPrecision(18, 2).IsRequired();

                // A zero-amount entry records nothing and would only be noise.
                entry.ToTable(t => t.HasCheckConstraint("CK_Entries_Amount_NonZero", "\"Amount\" <> 0"));

                entry.HasOne(e => e.Transaction)
                    .WithMany(t => t.Entries)
                    .HasForeignKey(e => e.TransactionId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Restrict, not Cascade: deleting an account that has been posted to
                // would destroy history. The database refuses instead.
                entry.HasOne(e => e.Account)
                    .WithMany()
                    .HasForeignKey(e => e.AccountId)
                    .OnDelete(DeleteBehavior.Restrict);

                // Balances are SUM(Amount) filtered by account, so this is the index
                // that matters.
                entry.HasIndex(e => e.AccountId);
            });
        }
    }
}
