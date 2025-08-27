using Entrevistas.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Entrevistas.Infrastructure.Database.Configurations
{
    public class FuncionalidadeConfig : IEntityTypeConfiguration<Funcionalidade>
    {
        public void Configure(EntityTypeBuilder<Funcionalidade> b)
        {
            b.ToTable("Funcionalidades");
            b.HasKey(x => x.Id);

            b.Property(x => x.Nome).HasMaxLength(200).IsRequired();
            b.Property(x => x.Template).HasMaxLength(20);

            b.HasIndex(x => new { x.EntrevistaId, x.Nome })
             .IsUnique()
             .HasDatabaseName("UQ_Funcionalidade_Entrevista_Nome");

            b.HasOne(x => x.Entrevista)
             .WithMany(e => e.Funcionalidades)
             .HasForeignKey(x => x.EntrevistaId)
             .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(x => x.Medicao)
             .WithOne(m => m.Funcionalidade)
             .HasForeignKey<MedicaoCosmic>(m => m.FuncionalidadeId)
             .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
