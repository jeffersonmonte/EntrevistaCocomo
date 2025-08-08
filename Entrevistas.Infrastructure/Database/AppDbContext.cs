using Entrevistas.Domain.Entities;
using Entrevistas.Infrastructure.Database.Configurations;
using Microsoft.EntityFrameworkCore;

namespace Entrevistas.Infrastructure.Database
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        public DbSet<Entrevista> Entrevistas => Set<Entrevista>();
        public DbSet<ScaleFactor> ScaleFactors => Set<ScaleFactor>();
        public DbSet<EffortMultiplier> EffortMultipliers => Set<EffortMultiplier>();
        public DbSet<ParametrosCocomo> ParametrosCocomo => Set<ParametrosCocomo>();
        public DbSet<ConversaoTamanho> ConversoesTamanho => Set<ConversaoTamanho>();
        public DbSet<FatoresConversao> FatoresConversao => Set<FatoresConversao>();
        public DbSet<Funcionalidade> Funcionalidades => Set<Funcionalidade>();
        public DbSet<MedicaoCosmic> MedicoesCosmic => Set<MedicaoCosmic>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Entrevista>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.NomeEntrevistado).HasMaxLength(100).IsRequired();
                entity.Property(e => e.NomeEntrevistador).HasMaxLength(100).IsRequired();

                entity.HasMany(e => e.ScaleFactors)
                      .WithOne(f => f.Entrevista)
                      .HasForeignKey(f => f.EntrevistaId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(e => e.EffortMultipliers)
                      .WithOne(f => f.Entrevista)
                      .HasForeignKey(f => f.EntrevistaId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<ScaleFactor>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Nome).HasMaxLength(50).IsRequired();
                entity.Property(e => e.Nivel).HasMaxLength(50).IsRequired();
                entity.Property(e => e.Valor).HasColumnType("decimal(5,2)");
            });

            modelBuilder.Entity<EffortMultiplier>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Nome).HasMaxLength(50).IsRequired();
                entity.Property(e => e.Nivel).HasMaxLength(50).IsRequired();
                entity.Property(e => e.Valor).HasColumnType("decimal(5,3)");
            });

            modelBuilder.Entity<ParametrosCocomo>(entity =>
            {
                entity.HasKey(p => p.Id);
                entity.Property(p => p.A).HasColumnType("decimal(8,4)");
                entity.Property(p => p.B).HasColumnType("decimal(8,4)");
                entity.Property(p => p.C).HasColumnType("decimal(8,4)");
                entity.Property(p => p.D).HasColumnType("decimal(8,4)");
            });

            modelBuilder.Entity<ConversaoTamanho>(entity =>
            {
                entity.HasKey(c => c.Id);
                entity.Property(c => c.TipoEntrada).HasMaxLength(20).IsRequired();
                entity.Property(c => c.Contexto).HasMaxLength(100).IsRequired();
                entity.Property(c => c.FatorConversao).HasColumnType("decimal(8,4)");
            });

            modelBuilder.ApplyConfiguration(new FuncionalidadeConfig());

            modelBuilder.ApplyConfiguration(new MedicaoCosmicConfig());
        }
    }
}
