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
    public class FuncionalidadeConfig : IEntityTypeConfiguration<Funcionalidade>
    {
        public void Configure(EntityTypeBuilder<Funcionalidade> b)
        {
            b.ToTable("Funcionalidades");
            b.HasKey(x => x.Id);
            b.Property(x => x.Nome).HasMaxLength(200).IsRequired();
            b.Property(x => x.Template).HasMaxLength(20);

            b.HasOne(x => x.Entrevista)
             .WithMany(e => e.Funcionalidades)
             .HasForeignKey(x => x.EntrevistaId);

            b.HasOne(x => x.Medicao)
             .WithOne(m => m.Funcionalidade)
             .HasForeignKey<MedicaoCosmic>(m => m.FuncionalidadeId);
        }
    }
}
