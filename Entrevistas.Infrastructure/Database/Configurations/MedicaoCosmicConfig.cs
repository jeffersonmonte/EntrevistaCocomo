using Entrevistas.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Entrevistas.Infrastructure.Database.Configurations
{
    public class MedicaoCosmicConfig : IEntityTypeConfiguration<MedicaoCosmic>
    {
        public void Configure(EntityTypeBuilder<MedicaoCosmic> b)
        {
            b.ToTable("MedicoesCosmic");
            b.HasKey(x => x.Id);
            b.Property(x => x.EntryE).HasDefaultValue(0);
            b.Property(x => x.ExitX).HasDefaultValue(0);
            b.Property(x => x.ReadR).HasDefaultValue(0);
            b.Property(x => x.WriteW).HasDefaultValue(0);
        }
    }
}
