using Entrevistas.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Entrevistas.Infrastructure.Configurations
{
    public class MedicaoCosmicConfig : IEntityTypeConfiguration<MedicaoCosmic>
    {
        public void Configure(EntityTypeBuilder<MedicaoCosmic> b)
        {
            b.ToTable("MedicoesCosmic");
            b.HasKey(x => x.Id);

            b.Property(x => x.EntryE).IsRequired();
            b.Property(x => x.ExitX).IsRequired();
            b.Property(x => x.ReadR).IsRequired();
            b.Property(x => x.WriteW).IsRequired();

            b.HasIndex(x => x.FuncionalidadeId).IsUnique();
        }
    }
}
