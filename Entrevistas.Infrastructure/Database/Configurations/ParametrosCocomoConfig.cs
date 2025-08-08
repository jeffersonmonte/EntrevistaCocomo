using Entrevistas.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Entrevistas.Infrastructure.Database.Configurations
{
    public class ParametrosCocomoConfig : IEntityTypeConfiguration<ParametrosCocomo>
    {
        public void Configure(EntityTypeBuilder<ParametrosCocomo> builder)
        {
            builder.HasKey(p => p.Id);
            builder.Property(p => p.A).IsRequired();
            builder.Property(p => p.B).IsRequired();
            builder.Property(p => p.C).IsRequired();
            builder.Property(p => p.D).IsRequired();
        }
    }
}
