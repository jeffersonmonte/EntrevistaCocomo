using Entrevistas.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Entrevistas.Infrastructure.Database.Configurations
{
    public class MonteCarloResultadoConfig : IEntityTypeConfiguration<MonteCarloResultado>
    {
        public void Configure(EntityTypeBuilder<MonteCarloResultado> b)
        {
            b.ToTable("MonteCarloResultados");
            b.HasKey(x => x.Id);

            b.HasOne(x => x.Entrevista)
             .WithMany()
             .HasForeignKey(x => x.EntrevistaId)
             .OnDelete(DeleteBehavior.Cascade);

            // Precisões para decimais
            b.Property(x => x.KlocMin).HasPrecision(18, 4);
            b.Property(x => x.KlocMode).HasPrecision(18, 4);
            b.Property(x => x.KlocMax).HasPrecision(18, 4);
            b.Property(x => x.A).HasPrecision(18, 6);
            b.Property(x => x.B).HasPrecision(18, 6);
            b.Property(x => x.C).HasPrecision(18, 6);
            b.Property(x => x.D).HasPrecision(18, 6);
            b.Property(x => x.SomaScaleFactors).HasPrecision(18, 6);
            b.Property(x => x.ProdutoEffortMultipliers).HasPrecision(18, 6);
            b.Property(x => x.TamanhoKloc).HasPrecision(18, 6);

            b.Property(x => x.P10_PM).HasPrecision(18, 6);
            b.Property(x => x.P50_PM).HasPrecision(18, 6);
            b.Property(x => x.P90_PM).HasPrecision(18, 6);
            b.Property(x => x.Media_PM).HasPrecision(18, 6);
            b.Property(x => x.Desvio_PM).HasPrecision(18, 6);

            b.Property(x => x.P10_TDEV).HasPrecision(18, 6);
            b.Property(x => x.P50_TDEV).HasPrecision(18, 6);
            b.Property(x => x.P90_TDEV).HasPrecision(18, 6);
            b.Property(x => x.Media_TDEV).HasPrecision(18, 6);
            b.Property(x => x.Desvio_TDEV).HasPrecision(18, 6);

            b.HasIndex(x => new { x.EntrevistaId, x.CreatedAt });
            b.HasIndex(x => new { x.EntrevistaId, x.IsAtual });
        }
    }
}
