using Entrevistas.Domain.Entities;
using Entrevistas.Infrastructure.Configurations;
using Entrevistas.Infrastructure.Database.Configurations;
using Microsoft.EntityFrameworkCore;

namespace Entrevistas.Infrastructure.Database
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> opts) : base(opts) { }

        public DbSet<Entrevista> Entrevistas => Set<Entrevista>();
        public DbSet<ScaleFactor> ScaleFactors => Set<ScaleFactor>();
        public DbSet<EffortMultiplier> EffortMultipliers => Set<EffortMultiplier>();
        public DbSet<Funcionalidade> Funcionalidades => Set<Funcionalidade>();
        public DbSet<MedicaoCosmic> MedicoesCosmic => Set<MedicaoCosmic>();
        public DbSet<ParametrosCocomo> ParametrosCocomo => Set<ParametrosCocomo>();
        public DbSet<ConversaoTamanho> ConversoesTamanho => Set<ConversaoTamanho>();
        public DbSet<FatoresConversao> FatoresConversao => Set<FatoresConversao>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // === Mantém exatamente seu padrão de ApplyConfiguration ===
            modelBuilder.ApplyConfiguration(new EntrevistaConfig());
            modelBuilder.ApplyConfiguration(new ScaleFactorConfig());
            modelBuilder.ApplyConfiguration(new EffortMultiplierConfig());
            modelBuilder.ApplyConfiguration(new FuncionalidadeConfig());
            modelBuilder.ApplyConfiguration(new MedicaoCosmicConfig());

            modelBuilder.ApplyConfiguration(new ConversaoTamanhoConfig());
            modelBuilder.ApplyConfiguration(new ParametrosCocomoConfig());
            modelBuilder.ApplyConfiguration(new FatoresConversaoConfig());

            // (Opcional) Índices úteis – NÃO removem nada do que você já tem no SQL
            modelBuilder.Entity<Entrevista>().HasIndex(x => x.DataEntrevista);
            modelBuilder.Entity<Entrevista>().HasIndex(x => new { x.NomeEntrevistado, x.NomeEntrevistador });

            base.OnModelCreating(modelBuilder);
        }
    }
}
