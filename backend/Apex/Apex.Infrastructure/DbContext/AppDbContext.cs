using Apex.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;

namespace Apex.Infrastructure.DbContext;

public class AppDbContext : Microsoft.EntityFrameworkCore.DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Trade> Trades { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<Strategy> Strategies { get; set; }
    public DbSet<StrategyRule> StrategyRules { get; set; }
    public DbSet<TradeRuleCheck> TradeRuleChecks { get; set; }
    public DbSet<TradeExit> TradeExits { get; set; }
    public DbSet<Instrument> Instruments { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Trade>(entity =>
        {
            entity.HasKey(t => t.Id);

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

            entity.HasOne(t => t.Strategy).WithMany()
                .HasForeignKey(t => t.StrategyId)
                .OnDelete(DeleteBehavior.SetNull);

            // Restrict: uno strumento del catalogo non può sparire se ci sono trade che lo usano.
            entity.HasOne(t => t.Instrument).WithMany()
                .HasForeignKey(t => t.InstrumentId)
                .OnDelete(DeleteBehavior.Restrict);
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

        modelBuilder.Entity<Strategy>(entity =>
        {
            entity.HasKey(s => s.Id);

            // Many-to-many verso il catalogo (#95). WithMany() senza navigation inversa:
            // Instrument è globale e condiviso, non deve sapere quali strategie lo usano.
            // Tabella di join esplicita per non dipendere dal nome generato da EF.
            // Restrict verso il catalogo, come per Trade.Instrument: uno strumento usato
            // da una strategia non deve sparire. Cascade verso la strategia: se la
            // strategia muore, le sue associazioni non hanno più senso.
            entity.HasMany(s => s.Instruments)
                .WithMany()
                .UsingEntity(
                    "StrategyInstruments",
                    right => right.HasOne(typeof(Instrument))
                        .WithMany()
                        .HasForeignKey("InstrumentId")
                        .OnDelete(DeleteBehavior.Restrict),
                    left => left.HasOne(typeof(Strategy))
                        .WithMany()
                        .HasForeignKey("StrategyId")
                        .OnDelete(DeleteBehavior.Cascade));

            entity.Property(s => s.Name)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(s => s.Description)
                .HasMaxLength(1000);

            entity.HasOne(s => s.User)
                .WithMany()
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.Cascade);


            entity.HasMany(s => s.Rules)
                .WithOne(r => r.Strategy)
                .HasForeignKey(r => r.StrategyId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<StrategyRule>(entity =>
        {
            entity.HasKey(r => r.Id);

            entity.Property(r => r.Label)
                .IsRequired()
                .HasMaxLength(200);
        });

        modelBuilder.Entity<Instrument>(entity =>
        {
            entity.HasKey(i => i.InstrumentId);

            entity.Property(i => i.Symbol)
                .IsRequired()
                .HasMaxLength(10);

            entity.HasIndex(i => i.Symbol)
                .IsUnique();

            entity.Property(i => i.InstrumentName)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(i => i.Currency)
                .IsRequired()
                .HasMaxLength(3);

            entity.Property(i => i.PointValue)
                .HasPrecision(18, 4);

            entity.Property(i => i.TickSize)
                .HasPrecision(18, 4);

            entity.Property(i => i.TickValue)
                .HasPrecision(18, 4);

            entity.Property(i => i.Type)
                .HasConversion<string>();
        });

        InstrumentSeed.Seed(modelBuilder);

        modelBuilder.Entity<TradeExit>(e =>
        {
            e.HasKey(x => x.Id);

            e.Property(x => x.Price).HasPrecision(18, 4);
            e.Property(x => x.Outcome).HasConversion<string>();

            e.HasOne(x => x.Trade).WithMany(t => t.Exits)
                .HasForeignKey(x => x.TradeId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TradeRuleCheck>(e =>
        {
            e.HasOne(rc => rc.Trade).WithMany(t => t.RuleChecks)
                .HasForeignKey(rc => rc.TradeId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(rc => rc.StrategyRule).WithMany()
                .HasForeignKey(rc => rc.StrategyRuleId).OnDelete(DeleteBehavior.Restrict); 
        });


    }

}
