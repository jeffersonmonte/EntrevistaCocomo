using Entrevistas.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Entrevistas.Infrastructure.Database.Configurations
{
    public class EffortMultiplierConfig : IEntityTypeConfiguration<EffortMultiplier>
    {
        public void Configure(EntityTypeBuilder<EffortMultiplier> b)
        {
            b.ToTable("EffortMultipliers");
            b.HasKey(x => x.Id);

            b.Property(x => x.Nome).HasMaxLength(50).IsRequired();
            b.Property(x => x.Nivel).HasMaxLength(50).IsRequired();
            b.Property(x => x.Valor).HasColumnType("decimal(5,3)");

            b.HasIndex(x => new { x.EntrevistaId, x.Nome })
             .IsUnique()
             .HasDatabaseName("UX_EM_Entrevista_Nome");

            b.HasOne(x => x.Entrevista)
             .WithMany(e => e.EffortMultipliers)
             .HasForeignKey(x => x.EntrevistaId)
             .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
