using Entrevistas.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Entrevistas.Infrastructure.Configurations
{
    public class ParametrosCocomoConfig : IEntityTypeConfiguration<ParametrosCocomo>
    {
        public void Configure(EntityTypeBuilder<ParametrosCocomo> b)
        {
            b.ToTable("ParametrosCocomo");
            b.HasKey(x => x.Id);

            b.Property(x => x.A).HasColumnType("decimal(8,4)");
            b.Property(x => x.B).HasColumnType("decimal(8,4)");
            b.Property(x => x.C).HasColumnType("decimal(8,4)");
            b.Property(x => x.D).HasColumnType("decimal(8,4)");
        }
    }
}
