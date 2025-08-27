using Entrevistas.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Entrevistas.Infrastructure.Database.Configurations
{
    public class FatoresConversaoConfig : IEntityTypeConfiguration<FatoresConversao>
    {
        public void Configure(EntityTypeBuilder<FatoresConversao> b)
        {
            b.ToTable("FatoresConversao");
            b.HasKey(x => x.Id);

            b.Property(x => x.TipoEntrada).HasMaxLength(50).IsRequired();
            b.Property(x => x.Contexto).HasMaxLength(50).IsRequired();
            b.Property(x => x.Nivel).HasMaxLength(50).IsRequired();
            b.Property(x => x.FatorConversao).HasColumnType("decimal(18,6)").IsRequired();
            b.Property(x => x.NomeCompleto).HasMaxLength(150);
            b.Property(x => x.Descricao).HasMaxLength(500);

            b.HasIndex(x => new { x.TipoEntrada, x.Contexto, x.Nivel })
             .IsUnique()
             .HasDatabaseName("UX_FatoresConversao");
        }
    }
}
