using Entrevistas.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Entrevistas.Infrastructure.Database.Configurations
{
    public class EntrevistaConfig : IEntityTypeConfiguration<Entrevista>
    {
        public void Configure(EntityTypeBuilder<Entrevista> e)
        {
            e.ToTable("Entrevistas");
            e.HasKey(x => x.Id);

            e.Property(x => x.NomeEntrevista).HasMaxLength(120).IsRequired();

            e.Property(x => x.TamanhoKloc).HasColumnType("decimal(18,6)");
            e.Property(x => x.SomaScaleFactors).HasColumnType("decimal(18,6)");
            e.Property(x => x.ProdutoEffortMultipliers).HasColumnType("decimal(18,6)");
            e.Property(x => x.EsforcoPM).HasColumnType("decimal(18,6)");
            e.Property(x => x.PrazoMeses).HasColumnType("decimal(18,6)");

            e.Property(x => x.TotalCFP).HasDefaultValue(0);

            e.HasIndex(x => x.DataEntrevista).HasDatabaseName("IX_Entrevistas_Data")
             .HasDatabaseName("IX_Entrevistas_Nomes");
        }
    }
}
