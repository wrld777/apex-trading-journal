using Apex.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;

namespace Apex.Infrastructure.DbContext;

public class AppDbContext : Microsoft.EntityFrameworkCore.DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Trade> Trades { get; set; }
    public DbSet<User> Users { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Trade>(entity =>
        {
            entity.HasKey(t => t.Id);

            entity.Property(t => t.Symbol)
                .IsRequired()
                .HasMaxLength(10);

            entity.Property(t => t.EntryPrice)
                .HasPrecision(18, 4);

            entity.Property(t => t.StopLoss)
                .HasPrecision(18, 4);

            entity.Property(t => t.TakeProfit)
                .HasPrecision(18, 4);

            entity.Property(t => t.ExitPrice)
                .HasPrecision(18, 4);

            entity.Property(t => t.PnL)
                .HasPrecision(18, 4);

            entity.Property(t => t.RiskReward)
                .HasPrecision(18, 4);

            entity.Property(t => t.Direction)
                .HasConversion<string>();

            entity.Property(t => t.Status)
                .HasConversion<string>();

            entity.Property(t => t.Tags)
                .HasColumnType("text[]");

            entity.Property(t => t.Screenshots)
                .HasColumnType("text[]");

            entity.HasOne(t => t.User)
                .WithMany(u => u.Trades)
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);

            entity.Property(u => u.Email)
                .IsRequired()
                .HasMaxLength(255);

            entity.HasIndex(u => u.Email)
                .IsUnique();

            entity.Property(u => u.Name)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(u => u.AccountSize)
                .HasPrecision(18, 4);
        });
    }
}
