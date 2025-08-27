using Entrevistas.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Entrevistas.Infrastructure.Database.Configurations
{
    public class ScaleFactorConfig : IEntityTypeConfiguration<ScaleFactor>
    {
        public void Configure(EntityTypeBuilder<ScaleFactor> b)
        {
            b.ToTable("ScaleFactors");
            b.HasKey(x => x.Id);

            b.Property(x => x.Nome).HasMaxLength(50).IsRequired();
            b.Property(x => x.Nivel).HasMaxLength(50).IsRequired();
            b.Property(x => x.Valor).HasColumnType("decimal(5,2)");

            b.HasIndex(x => new { x.EntrevistaId, x.Nome })
             .IsUnique()
             .HasDatabaseName("UX_SF_Entrevista_Nome");

            b.HasOne(x => x.Entrevista)
             .WithMany(e => e.ScaleFactors)
             .HasForeignKey(x => x.EntrevistaId)
             .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
